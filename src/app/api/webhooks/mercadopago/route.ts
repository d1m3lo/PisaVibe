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
          // A lógica para pagamentos com cartão é processada aqui automaticamente.
          // Pagamentos PIX aguardam confirmação manual e são tratados no painel admin, não aqui.
          if (payment.payment_method_id !== 'pix' && payment.payment_type_id !== 'account_money') {
             await createOrderFromPayment(payment);
          } else {
             console.log(`Pagamento PIX ${paymentId} recebido, aguardando confirmação manual do admin.`);
          }
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

async function createOrderFromPayment(payment: any) {
  const { metadata } = payment;
  const { shippingInfo: shippingInfoJSON, cartItems: cartItemsJSON, couponCode, discountAmount } = metadata;
  
  if (!shippingInfoJSON || !cartItemsJSON) {
    console.error(`Metadados ausentes para o pagamento ${payment.id}.`);
    return;
  }

  let shippingInfo, cartItems;
  try {
    shippingInfo = JSON.parse(shippingInfoJSON);
    cartItems = JSON.parse(cartItemsJSON);
  } catch (e) {
    console.error(`Erro ao parsear metadados do pagamento ${payment.id}:`, e);
    return;
  }
  
  const userEmail = shippingInfo.email;
  console.log(`Iniciando criação de pedido para o email: ${userEmail}`);

  const usersRef = db.collection('users');
  const userQuery = await usersRef.where('email', '==', userEmail).limit(1).get();

  if (userQuery.empty) {
     console.error(`Usuário com o e-mail ${userEmail} não encontrado para o pagamento ${payment.id}.`);
     return;
  }
  const userId = userQuery.docs[0].id;
  console.log(`Usuário encontrado: ${userId}`);

  const orderItems: OrderItem[] = cartItems.map((item: any) => {
      // O campo 'description' contém a cor e o tamanho, Ex: "Preto / 42"
      const descriptionParts = item.description?.split(' / ') || [];
      const color = descriptionParts[0] || '';
      const size = descriptionParts[1] || 'U';

      return {
          productId: item.id,
          productName: item.title,
          variantColor: color,
          size: size,
          quantity: item.quantity,
          price: item.unit_price,
          imageUrl: item.picture_url,
      };
  });

  const formattedAddress = `${shippingInfo.street}, ${shippingInfo.number}${shippingInfo.complement ? `, ${shippingInfo.complement}` : ''} - ${shippingInfo.neighborhood}, ${shippingInfo.city} - ${shippingInfo.state}, ${shippingInfo.zipCode}`;

  const newOrder: Omit<Order, 'id'> = {
    userId: userId,
    originalSessionId: payment.id,
    orderDate: new Date(payment.date_created).toISOString(),
    items: orderItems,
    totalAmount: payment.transaction_amount,
    status: 'Pedido confirmado',
    shippingAddress: formattedAddress,
    customerInfo: {
        name: shippingInfo.name || '',
        email: userEmail,
        phone: shippingInfo.phone || ''
    },
    paymentMethod: payment.payment_type_id as 'credit_card' | 'debit_card' | 'ticket' | 'account_money',
    couponCode: couponCode || undefined,
    discountAmount: parseFloat(discountAmount) || 0,
  };

  await db.collection('users').doc(userId).collection('orders').add(newOrder);

  console.log(`✅ Pedido criado com sucesso para o usuário ${userId} a partir do pagamento ${payment.id}.`);
}

