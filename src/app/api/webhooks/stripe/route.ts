
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import type { Order, OrderItem } from '@/lib/types';

// Esta configuração garante que o SDK Admin seja inicializado apenas uma vez.
let adminApp: App;
if (!getApps().length) {
    adminApp = initializeApp();
} else {
    adminApp = getApps()[0];
}

const db: Firestore = getFirestore(adminApp);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});

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

  if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('✅ Sessão de checkout concluída recebida:', session.id);
      
      try {
        await createUnverifiedOrderFromSession(session);
      } catch(error: any) {
        console.error('❌ Erro ao criar o pedido não verificado:', error);
        return NextResponse.json({ error: 'Falha ao criar o pedido.', details: error.message }, { status: 500 });
      }
  } else {
      console.log(`🤷‍♀️ Evento não tratado: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

/**
 * Cria um documento de pedido na coleção 'unverified-orders' do Firestore.
 * Estes pedidos aguardam aprovação manual no painel de controle.
 */
async function createUnverifiedOrderFromSession(session: Stripe.Checkout.Session) {
  const { userEmail, cartItems: cartItemsJSON } = session.metadata || {};
  if (!userEmail || !cartItemsJSON || !session.customer_details || !session.shipping_details) {
    throw new Error('A sessão da Stripe não contém os metadados ou detalhes necessários.');
  }
   console.log(`Iniciando criação de pedido não verificado para o email: ${userEmail}`);

  const usersRef = db.collection('users');
  const userQuery = await usersRef.where('email', '==', userEmail).limit(1).get();

  if (userQuery.empty) {
    throw new Error(`Usuário com o e-mail ${userEmail} não encontrado.`);
  }
  const userId = userQuery.docs[0].id;
  console.log(`Usuário encontrado: ${userId}`);

  const cartItems: OrderItem[] = JSON.parse(cartItemsJSON);

  const shippingAddress = session.shipping_details.address;
  const formattedAddress = [
    shippingAddress?.line1,
    shippingAddress?.line2,
    `${shippingAddress?.city}, ${shippingAddress?.state} ${shippingAddress?.postal_code}`,
    shippingAddress?.country,
  ].filter(Boolean).join(', ');

  const unverifiedOrder = {
    userId: userId,
    originalSessionId: session.id,
    orderDate: new Date(session.created * 1000).toISOString(),
    items: cartItems,
    totalAmount: (session.amount_total || 0) / 100,
    status: 'Pedido recebido' as const,
    shippingAddress: formattedAddress,
    customerInfo: {
        name: session.customer_details.name || '',
        email: session.customer_details.email || '',
    },
    paymentMethod: 'card' as const,
    couponCode: session.total_details?.discount_on_charge?.coupon?.name || undefined,
    discountAmount: (session.total_details?.amount_discount || 0) / 100,
  };

  await db.collection('unverified-orders').add(unverifiedOrder);

  console.log(`✅ Pedido não verificado criado com sucesso para o usuário ${userId}.`);
}
