
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';
import type { Order, OrderItem } from '@/lib/types';

// Interface for what we expect in unverified_orders
interface UnverifiedOrder {
  id: string;
  user_id: string;
  originalSessionId?: string;
  customerInfo: { name: string; email: string; };
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: string;
  paymentMethod: 'pix' | 'card';
  status: string;
  createdAt: string;
  couponCode?: string;
  discountAmount?: number;
}

export async function POST(req: NextRequest) {
  // Initialize Supabase Admin (service role) client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Configure Mercado Pago client
  const client = new MercadoPagoConfig({ 
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  });
  const paymentClient = new Payment(client);

  console.log("--- [Webhook Acionado] ---");
  const body = await req.json();
  const topic = body.topic || body.type;

  // We only care about payment events
  if (topic !== 'payment') {
    console.log(`[Webhook] Evento do tipo '${topic}' ignorado.`);
    return NextResponse.json({ received: true });
  }

  const paymentId = String(body.data.id);
  console.log(`[Webhook] ID do Pagamento Recebido: ${paymentId} | Tipo: ${typeof paymentId}`);

  try {
    const payment = await paymentClient.get({ id: paymentId });

    if (payment.status !== 'approved') {
      console.log(`[Webhook] Pagamento ${paymentId} não está 'approved'. Status atual: '${payment.status}'. Ignorando.`);
      return NextResponse.json({ received: true });
    }

    console.log(`[Webhook] Pagamento ${paymentId} APROVADO.`);

    // 1. IDEMPOTENCY CHECK: See if a final order was already created for this payment.
    const { data: existingOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('originalSessionId', paymentId)
      .limit(1);

    if (existingOrders && existingOrders.length > 0) {
      console.log(`[Webhook] IDEMPOTÊNCIA: Pedido final para o pagamento ${paymentId} já existe (ID: ${existingOrders[0].id}). Ignorando.`);
      return NextResponse.json({ received: true });
    }

    // 2. FIND THE PRE-ORDER
    const paymentMethodIdentifier = payment.payment_method_id;
    let unverifiedOrderData: UnverifiedOrder | null = null;
    let unverifiedOrderId: string | null = null;

    if (paymentMethodIdentifier === 'pix') {
      console.log(`[Webhook] BUSCANDO PRÉ-ORDEM (PIX): where('originalSessionId', '==', '${paymentId}')`);
      const { data } = await supabase
        .from('unverified_orders')
        .select('*')
        .eq('originalSessionId', paymentId)
        .limit(1)
        .single();
      
      if (data) {
        unverifiedOrderData = data as UnverifiedOrder;
        unverifiedOrderId = data.id;
      }
    } else {
      const externalReference = payment.external_reference;
      if (!externalReference) {
        console.warn(`[Webhook] Pagamento ${paymentId} (método: ${paymentMethodIdentifier}) não possui external_reference. Não é possível processar automaticamente.`);
        return NextResponse.json({ received: true });
      }
      console.log(`[Webhook] BUSCANDO PRÉ-ORDEM (Cartão): doc('${externalReference}')`);
      const { data } = await supabase
        .from('unverified_orders')
        .select('*')
        .eq('id', externalReference)
        .single();
      
      if (data) {
        unverifiedOrderData = data as UnverifiedOrder;
        unverifiedOrderId = data.id;
      }
    }

    // 3. CREATE FINAL ORDER if pre-order is found
    if (unverifiedOrderData && unverifiedOrderId) {
      console.log(`[Webhook] Pré-ordem encontrada: SIM (ID: ${unverifiedOrderId})`);
      
      // Additional check: Does the amount match?
      if (payment.transaction_amount && Math.abs(unverifiedOrderData.totalAmount - payment.transaction_amount) > 0.01) {
          console.error(`[Webhook] DISCREPÂNCIA DE VALOR para pré-ordem ${unverifiedOrderId}. Esperado: ${unverifiedOrderData.totalAmount}, Recebido: ${payment.transaction_amount}. Intervenção manual necessária.`);
          return NextResponse.json({ error: 'Discrepância de valor' }, { status: 400 });
      }

      // Build the final order
      const finalOrderData: any = {
        user_id: unverifiedOrderData.user_id,
        customerInfo: unverifiedOrderData.customerInfo,
        items: unverifiedOrderData.items,
        orderDate: new Date().toISOString(),
        totalAmount: unverifiedOrderData.totalAmount,
        shippingAddress: unverifiedOrderData.shippingAddress,
        status: 'Pedido confirmado',
        paymentMethod: payment.payment_method?.id || 'card',
        originalSessionId: paymentId,
      };

      if (unverifiedOrderData.couponCode) {
        finalOrderData.couponCode = unverifiedOrderData.couponCode;
      }
      if (unverifiedOrderData.discountAmount) {
        finalOrderData.discountAmount = unverifiedOrderData.discountAmount;
      }

      // Insert final order
      const { data: insertedOrder, error: insertError } = await supabase
        .from('orders')
        .insert(finalOrderData)
        .select('id')
        .single();
      
      if (insertError) throw insertError;

      // Increment coupon usage
      if (finalOrderData.couponCode) {
        const { data: couponData } = await supabase
          .from('coupons')
          .select('id, usageCount')
          .eq('code', finalOrderData.couponCode)
          .limit(1)
          .single();
        
        if (couponData) {
          await supabase
            .from('coupons')
            .update({ usageCount: (couponData.usageCount || 0) + 1 })
            .eq('id', couponData.id);
        }
      }

      // Add points to user: 1 point for every R$10
      const pointsEarned = Math.floor(unverifiedOrderData.totalAmount / 10);
      const { data: userData } = await supabase
        .from('users')
        .select('points')
        .eq('id', unverifiedOrderData.user_id)
        .single();
      
      await supabase
        .from('users')
        .update({ 
          points: ((userData as any)?.points || 0) + pointsEarned,
          lastPointsUpdate: new Date().toISOString()
        })
        .eq('id', unverifiedOrderData.user_id);

      // Delete unverified order
      await supabase
        .from('unverified_orders')
        .delete()
        .eq('id', unverifiedOrderId);

      console.log(`[Webhook] SUCESSO: Pedido ${insertedOrder?.id} criado automaticamente e ${pointsEarned} pontos adicionados.`);

    } else {
      console.log(`[Webhook] Pré-ordem encontrada: NÃO`);
    }

  } catch (error: any) {
    console.error(`[Webhook] ❌ ERRO GERAL ao processar notificação:`, error);
    return NextResponse.json({ error: 'Falha ao processar a notificação.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
