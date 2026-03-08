
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { getApps } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import type { Order, OrderItem } from '@/lib/types';
import * as admin from 'firebase-admin';

// Interface for what we expect in unverified-orders
interface UnverifiedOrder {
  id: string; // The doc ID from firestore
  userId: string;
  originalSessionId?: string; // Used for PIX paymentId
  customerInfo: { name: string; email: string; };
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: string;
  paymentMethod: 'pix' | 'card';
  status: string;
  createdAt: string; // ISO String
  couponCode?: string;
  discountAmount?: number;
}

// Initialize Firebase Admin SDK safely (prevents re-initialization)
if (!getApps().length) {
    admin.initializeApp();
}
const db: Firestore = getFirestore();

// Configure Mercado Pago client
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});
const paymentClient = new Payment(client);

export async function POST(req: NextRequest) {
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
    const finalOrdersCollection = db.collectionGroup('orders');
    const existingFinalOrderQuery = await finalOrdersCollection.where('originalSessionId', '==', paymentId).limit(1).get();

    if (!existingFinalOrderQuery.empty) {
      console.log(`[Webhook] IDEMPOTÊNCIA: Pedido final para o pagamento ${paymentId} já existe (ID: ${existingFinalOrderQuery.docs[0].id}). Ignorando.`);
      return NextResponse.json({ received: true });
    }

    // 2. FIND THE PRE-ORDER
    const unverifiedOrdersRef = db.collection('unverified-orders');
    let unverifiedQuery: admin.firestore.QuerySnapshot | undefined;
    const paymentMethodIdentifier = payment.payment_method_id; // e.g., 'pix', 'visa', 'master'

    if (paymentMethodIdentifier === 'pix') {
      console.log(`[Webhook] BUSCANDO PRÉ-ORDEM (PIX): where('originalSessionId', '==', '${paymentId}')`);
      unverifiedQuery = await unverifiedOrdersRef.where('originalSessionId', '==', paymentId).limit(1).get();
    } else { // Handles cards and other methods
      const externalReference = payment.external_reference;
      if (!externalReference) {
        console.warn(`[Webhook] Pagamento ${paymentId} (método: ${paymentMethodIdentifier}) não possui external_reference. Não é possível processar automaticamente.`);
        return NextResponse.json({ received: true });
      }
      console.log(`[Webhook] BUSCANDO PRÉ-ORDEM (Cartão): doc('${externalReference}')`);
      const docSnap = await unverifiedOrdersRef.doc(externalReference).get();
      if (docSnap.exists) {
        unverifiedQuery = { docs: [docSnap], empty: false } as admin.firestore.QuerySnapshot;
      }
    }

    // 3. CREATE FINAL ORDER if pre-order is found
    if (unverifiedQuery && !unverifiedQuery.empty) {
      const unverifiedOrderDoc = unverifiedQuery.docs[0];
      const unverifiedOrderData = unverifiedOrderDoc.data() as UnverifiedOrder;

      console.log(`[Webhook] Pré-ordem encontrada: SIM (ID: ${unverifiedOrderDoc.id})`);
      
      // Additional check: Does the amount match?
      if (payment.transaction_amount && Math.abs(unverifiedOrderData.totalAmount - payment.transaction_amount) > 0.01) {
          console.error(`[Webhook] DISCREPÂNCIA DE VALOR para pré-ordem ${unverifiedOrderDoc.id}. Esperado: ${unverifiedOrderData.totalAmount}, Recebido: ${payment.transaction_amount}. Intervenção manual necessária.`);
          return NextResponse.json({ error: 'Discrepância de valor' }, { status: 400 });
      }

      // Start an atomic batch operation
      const batch = db.batch();
      const finalOrderRef = db.collection(`users/${unverifiedOrderData.userId}/orders`).doc();
      
      const finalOrderData: Omit<Order, 'id'> & { [key: string]: any } = {
        userId: unverifiedOrderData.userId,
        customerInfo: unverifiedOrderData.customerInfo,
        items: unverifiedOrderData.items,
        orderDate: new Date().toISOString(),
        totalAmount: unverifiedOrderData.totalAmount,
        shippingAddress: unverifiedOrderData.shippingAddress,
        status: 'Pedido confirmado',
        paymentMethod: payment.payment_method?.id as Order['paymentMethod'] || 'card',
        originalSessionId: paymentId, // Save the payment ID for idempotency
      };

      if(unverifiedOrderData.couponCode) {
        finalOrderData.couponCode = unverifiedOrderData.couponCode;
      }
      if(unverifiedOrderData.discountAmount) {
        finalOrderData.discountAmount = unverifiedOrderData.discountAmount;
      }

      // Increment coupon usage
      if (finalOrderData.couponCode) {
          const couponsRef = db.collection('coupons');
          const couponQuery = await couponsRef.where('code', '==', finalOrderData.couponCode).limit(1).get();
          if (!couponQuery.empty) {
              const couponDoc = couponQuery.docs[0];
              batch.update(couponDoc.ref, { usageCount: admin.firestore.FieldValue.increment(1) });
          }
      }

      // Add points to user: 1 point for every R$10
      const pointsEarned = Math.floor(unverifiedOrderData.totalAmount / 10);
      const userRef = db.doc(`users/${unverifiedOrderData.userId}`);
      batch.update(userRef, { 
        points: admin.firestore.FieldValue.increment(pointsEarned),
        lastPointsUpdate: new Date().toISOString()
      });

      batch.set(finalOrderRef, finalOrderData);
      batch.delete(unverifiedOrderDoc.ref);
      
      await batch.commit();
      console.log(`[Webhook] SUCESSO: Pedido ${finalOrderRef.id} criado automaticamente e ${pointsEarned} pontos adicionados.`);

    } else {
      console.log(`[Webhook] Pré-ordem encontrada: NÃO`);
    }

  } catch (error: any) {
    console.error(`[Webhook] ❌ ERRO GERAL ao processar notificação:`, error);
    return NextResponse.json({ error: 'Falha ao processar a notificação.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
