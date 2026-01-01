
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { Order, OrderItem } from '@/lib/types';
import { credential } from 'firebase-admin';

// Initialize Firebase Admin SDK
// This is idempotent and will not re-initialize if already done.
let adminApp: App;
if (!getApps().length) {
    // In a deployed environment (like Vercel or Firebase App Hosting),
    // GOOGLE_APPLICATION_CREDENTIALS will be set automatically.
    // Locally, you might need to set this env var to point to your service account key file.
    adminApp = initializeApp();
} else {
    adminApp = getApps()[0];
}

const db = getFirestore(adminApp);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const buf = await req.text();
  const sig = headers().get('Stripe-Signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('✅ Checkout session completed:', session.id);
      
      try {
        await createOrderFromSession(session, db);
      } catch(error: any) {
        console.error('❌ Error creating order from session:', error);
        return NextResponse.json({ error: 'Failed to create order.', details: error.message }, { status: 500 });
      }
      break;
    default:
      console.log(`🤷‍♀️ Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function createOrderFromSession(session: Stripe.Checkout.Session, firestore: Firestore) {
  if (!session.metadata?.userEmail || !session.customer_details || !session.shipping_details) {
    throw new Error('Session is missing required metadata or details.');
  }

  const userEmail = session.metadata.userEmail;
  const usersRef = firestore.collection('users');
  const userQuery = await usersRef.where('email', '==', userEmail).limit(1).get();

  if (userQuery.empty) {
    throw new Error(`User with email ${userEmail} not found.`);
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
    status: 'Processing',
    shippingAddress: formattedAddress,
    customerInfo: {
        name: session.customer_details.name || '',
        email: session.customer_details.email || '',
    },
    paymentMethod: 'card', // Assuming card for now
    couponCode: session.total_details?.discount_on_charge?.coupon?.name || undefined,
    discountAmount: (session.total_details?.amount_discount || 0) / 100,
  };

  // Add the new order to the user's 'orders' subcollection
  const orderRef = await firestore.collection('users').doc(userId).collection('orders').add(newOrder);

  console.log(`✅ Order ${orderRef.id} created successfully for user ${userId}.`);
}
