
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { Order, OrderItem } from '@/lib/types';
import { credential } from 'firebase-admin';

// Esta configuração garante que o SDK Admin seja inicializado apenas uma vez.
let adminApp: App;
if (!getApps().length) {
    // Em um ambiente de produção (como o Firebase App Hosting), 
    // as credenciais são fornecidas automaticamente.
    adminApp = initializeApp();
} else {
    adminApp = getApps()[0];
}

const db = getFirestore(adminApp);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// A chave secreta do webhook é essencial para segurança.
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const buf = await req.text();
  const sig = headers().get('Stripe-Signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Falha na verificação da assinatura do Webhook: ${err.message}`);
    return NextResponse.json({ error: `Erro de Webhook: ${err.message}` }, { status: 400 });
  }

  // Lida apenas com o evento de sessão de checkout concluída
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('✅ Sessão de checkout concluída:', session.id);
      
      try {
        await createOrderFromSession(session, db);
      } catch(error: any) {
        console.error('❌ Erro ao criar o pedido a partir da sessão:', error);
        return NextResponse.json({ error: 'Falha ao criar o pedido.', details: error.message }, { status: 500 });
      }
      break;
    default:
      console.log(`🤷‍♀️ Evento não tratado: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

/**
 * Cria um documento de pedido no Firestore com base nos dados da sessão da Stripe.
 */
async function createOrderFromSession(session: Stripe.Checkout.Session, firestore: Firestore) {
  if (!session.metadata?.userEmail || !session.customer_details || !session.shipping_details) {
    throw new Error('A sessão da Stripe não contém os metadados ou detalhes necessários.');
  }

  const userEmail = session.metadata.userEmail;
  const usersRef = firestore.collection('users');
  // Encontra o usuário no Firestore pelo e-mail para obter o UID
  const userQuery = await usersRef.where('email', '==', userEmail).limit(1).get();

  if (userQuery.empty) {
    throw new Error(`Usuário com o e-mail ${userEmail} não encontrado.`);
  }
  const userDoc = userQuery.docs[0];
  const userId = userDoc.id;

  const cartItems = JSON.parse(session.metadata.cartItems) as OrderItem[];

  const shippingAddress = session.shipping_details.address;
  const formattedAddress = [
    shippingAddress?.line1,
    shippingAddress?.line2,
    `${shippingAddress?.city}, ${shippingAddress?.state} ${shippingAddress?.postal_code}`,
    shippingAddress?.country,
  ].filter(Boolean).join(', ');

  const newOrder: Omit<Order, 'id'> = {
    userId: userId,
    orderDate: new Date().toISOString(),
    items: cartItems,
    totalAmount: (session.amount_total || 0) / 100,
    status: 'Pedido confirmado',
    shippingAddress: formattedAddress,
    customerInfo: {
        name: session.customer_details.name || '',
        email: session.customer_details.email || '',
    },
    paymentMethod: 'card',
    couponCode: session.total_details?.discount_on_charge?.coupon?.name || undefined,
    discountAmount: (session.total_details?.amount_discount || 0) / 100,
  };

  // Adiciona o novo pedido à subcoleção 'orders' do usuário
  const orderRef = await firestore.collection('users').doc(userId).collection('orders').add(newOrder);

  console.log(`✅ Pedido ${orderRef.id} criado com sucesso para o usuário ${userId}.`);
}
