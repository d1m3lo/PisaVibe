
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import type { Order, OrderItem } from '@/lib/types';

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

      if (payment && payment.status === 'approved' && payment.metadata) {
        console.log(`✅ Pagamento ${paymentId} aprovado. Processando pedido...`);
        
        // This webhook now ONLY creates the final order.
        // The unverified order is created on the client-side.
        const existingOrderQuery = await db.collectionGroup('orders')
          .where('originalSessionId', '==', paymentId)
          .limit(1)
          .get();

        if (existingOrderQuery.empty) {
          // The manual verification flow is handled by the admin panel now for both PIX and Card
          console.log(`Pagamento ${paymentId} aprovado, aguardando confirmação manual do admin.`);
        } else {
          console.log(`Pedido para o pagamento ${paymentId} já existe. Ignorando.`);
        }
      } else {
        console.log(`Pagamento ${paymentId} não está em estado 'approved' ou não possui metadados. Status: ${payment?.status}`);
      }

    } catch (error: any) {
      console.error(`❌ Erro ao buscar dados do pagamento ${paymentId}:`, error);
      return NextResponse.json({ error: 'Falha ao processar a notificação.' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

    