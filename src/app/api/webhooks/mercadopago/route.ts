
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
        
        const existingOrderQuery = await db.collectionGroup('orders')
          .where('originalSessionId', '==', paymentId)
          .limit(1)
          .get();

        if (existingOrderQuery.empty) {
          await createUnverifiedOrderFromPayment(payment);
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

async function createUnverifiedOrderFromPayment(payment: any) {
  const { metadata } = payment;
  const { userEmail, cartItems: cartItemsJSON, couponCode, discountAmount } = metadata;
  const { payer } = payment.additional_info;
  const shipping = payment.card?.cardholder || payer; // Aproximação dos dados

  if (!userEmail || !cartItemsJSON) {
    throw new Error('Metadados da preferência do Mercado Pago estão ausentes ou incompletos.');
  }
   console.log(`Iniciando criação de pedido não verificado para o email: ${userEmail}`);

  const usersRef = db.collection('users');
  const userQuery = await usersRef.where('email', '==', userEmail).limit(1).get();

  if (userQuery.empty) {
    throw new Error(`Usuário com o e-mail ${userEmail} não encontrado.`);
  }
  const userId = userQuery.docs[0].id;
  console.log(`Usuário encontrado: ${userId}`);

  const cartItems: OrderItem[] = JSON.parse(cartItemsJSON).map((item: any) => ({
      productId: item.id,
      productName: item.title,
      variantColor: item.description?.split(' / ')[0] || '',
      size: item.description?.split(' / ')[1] || 'U',
      quantity: item.quantity,
      price: item.unit_price,
      imageUrl: item.picture_url,
  }));

  // Simulação do endereço, já que o brick do MP não coleta endereço de entrega.
  const formattedAddress = 'Endereço a ser confirmado pelo admin.';

  const unverifiedOrder = {
    userId: userId,
    originalSessionId: payment.id,
    orderDate: new Date(payment.date_created).toISOString(),
    items: cartItems,
    totalAmount: payment.transaction_amount,
    status: 'Pedido recebido' as const,
    shippingAddress: formattedAddress,
    customerInfo: {
        name: shipping.name || '',
        email: userEmail,
    },
    paymentMethod: payment.payment_type_id as 'card' | 'pix',
    couponCode: couponCode || undefined,
    discountAmount: discountAmount || 0,
  };

  await db.collection('unverified-orders').add(unverifiedOrder);

  console.log(`✅ Pedido não verificado criado com sucesso para o usuário ${userId}.`);
}
