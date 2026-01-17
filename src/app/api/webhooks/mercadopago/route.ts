
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import type { Order, OrderItem } from '@/lib/types';

// Define a forma da pré-ordem, incluindo campos opcionais
interface UnverifiedOrder {
  id: string;
  userId: string;
  originalSessionId?: string;
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

// Garante que o SDK Admin seja inicializado apenas uma vez.
let adminApp: App;
if (!getApps().length) {
    adminApp = initializeApp();
} else {
    adminApp = getApps()[0];
}

const db: Firestore = getFirestore(adminApp);

const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const topic = body.topic || body.type;
  
  if (topic === 'payment') {
    const paymentId = body.data.id;
    console.log(`🔔 Notificação de pagamento recebida: ${paymentId}`);
    
    try {
      const payment = await new Payment(client).get({ id: paymentId });

      // 1. Processar apenas pagamentos de cartão aprovados com metadados de usuário
      if (payment && payment.status === 'approved' && payment.metadata?.userId && payment.payment_method_id !== 'pix') {
        console.log(`✅ Pagamento com cartão ${paymentId} aprovado. Processando pedido...`);
        
        // 2. Verificar se o pedido já foi processado para garantir idempotência
        const finalOrdersCollection = db.collectionGroup('orders');
        const existingOrderQuery = await finalOrdersCollection
          .where('originalSessionId', '==', paymentId)
          .limit(1)
          .get();

        if (!existingOrderQuery.empty) {
          console.log(`Pedido para o pagamento ${paymentId} já existe. Ignorando.`);
          return NextResponse.json({ received: true });
        }
        
        // 3. Encontrar a pré-ordem correspondente
        const unverifiedOrdersRef = db.collection('unverified-orders');
        const unverifiedQuery = await unverifiedOrdersRef
            .where('userId', '==', payment.metadata.userId)
            .where('paymentMethod', '==', 'card')
            .orderBy('createdAt', 'desc')
            .get();

        if (unverifiedQuery.empty) {
            console.log(`Nenhuma pré-ordem pendente encontrada para o usuário ${payment.metadata.userId} com método 'card'.`);
            return NextResponse.json({ received: true });
        }
        
        // Corresponder pelo valor exato para encontrar a pré-ordem correta
        const unverifiedOrderDoc = unverifiedQuery.docs.find(doc => 
            Math.abs(doc.data().totalAmount - payment.transaction_amount) < 0.01
        );

        if (!unverifiedOrderDoc) {
             console.log(`Não foi encontrada pré-ordem com valor R$ ${payment.transaction_amount} para o usuário ${payment.metadata.userId}.`);
             return NextResponse.json({ received: true });
        }
        
        const unverifiedOrder = unverifiedOrderDoc.data() as UnverifiedOrder;

        // 4. Criar atomicamente o pedido final e remover a pré-ordem
        const batch = db.batch();
        const newOrderRef = db.collection(`users/${unverifiedOrder.userId}/orders`).doc();

        const newOrderData: Omit<Order, 'id'> = {
            userId: unverifiedOrder.userId,
            customerInfo: unverifiedOrder.customerInfo,
            items: unverifiedOrder.items,
            orderDate: new Date().toISOString(),
            totalAmount: unverifiedOrder.totalAmount,
            shippingAddress: unverifiedOrder.shippingAddress,
            status: 'Pedido confirmado',
            paymentMethod: 'credit_card', // Define como cartão
            originalSessionId: paymentId, // Link para o pagamento do Mercado Pago
            couponCode: unverifiedOrder.couponCode,
            discountAmount: unverifiedOrder.discountAmount,
        };

        batch.set(newOrderRef, newOrderData);
        batch.delete(unverifiedOrderDoc.ref);
        
        await batch.commit();

        console.log(`🎉 Pedido ${newOrderRef.id} criado com sucesso a partir da pré-ordem ${unverifiedOrderDoc.id}.`);

      } else {
        // Ignorar pagamentos que não são de cartão aprovado (ex: PIX, recusados, pendentes)
        console.log(`Pagamento ${paymentId} não é uma aprovação de cartão válida ou não possui metadados. Status: ${payment?.status}, Método: ${payment?.payment_method_id}. Ignorando.`);
      }

    } catch (error: any) {
      console.error(`❌ Erro ao processar notificação para pagamento ${paymentId}:`, error);
      // Retornar 500 para que o Mercado Pago possa tentar novamente
      return NextResponse.json({ error: 'Falha ao processar a notificação.' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
    
