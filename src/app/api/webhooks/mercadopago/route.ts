
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import type { Order, OrderItem } from '@/lib/types';
import * as admin from 'firebase-admin';

// Interface para a estrutura da pré-ordem
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

// Inicializa o SDK Admin do Firebase de forma segura (impede re-inicialização)
if (!getApps().length) {
    admin.initializeApp();
}

const db: Firestore = getFirestore();

// Configura o cliente do Mercado Pago
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});
const paymentClient = new Payment(client);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const topic = body.topic || body.type;

  console.log(`[Webhook] Notificação recebida. Tópico: ${topic}`);
  
  if (topic === 'payment') {
    const paymentId = String(body.data.id);
    console.log(`[Webhook] Processando ID de pagamento: ${paymentId}`);
    
    try {
      const payment = await paymentClient.get({ id: paymentId });
      console.log(`[Webhook] Pagamento ${paymentId} obtido. Status: ${payment.status}, Método: ${payment.payment_method_id}`);

      // Processa apenas pagamentos com status 'aprovado'
      if (payment && payment.status === 'approved') {
        console.log(`[Webhook] Pagamento ${paymentId} APROVADO.`);

        // 1. VERIFICAÇÃO DE IDEMPOTÊNCIA: Checa se um pedido final já foi criado para este pagamento
        const finalOrdersCollection = db.collectionGroup('orders');
        const existingFinalOrderQuery = await finalOrdersCollection
            .where('originalSessionId', '==', paymentId)
            .limit(1)
            .get();

        if (!existingFinalOrderQuery.empty) {
            console.log(`[Webhook] Pedido final para o pagamento ${paymentId} já existe (${existingFinalOrderQuery.docs[0].id}). Ignorando.`);
            
            // Limpa qualquer pré-ordem remanescente para este pagamento, garantindo a limpeza do sistema
            const lingeringPreOrders = await db.collection('unverified-orders').where('originalSessionId', '==', paymentId).get();
            if (!lingeringPreOrders.empty) {
                const batch = db.batch();
                lingeringPreOrders.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
                console.log(`[Webhook] Pré-ordem(s) remanescente(s) para o pagamento ${paymentId} removida(s).`);
            }
            return NextResponse.json({ received: true });
        }

        // 2. ENCONTRAR A PRÉ-ORDEM CORRESPONDENTE
        const unverifiedOrdersRef = db.collection('unverified-orders');
        let unverifiedQuery;
        
        if (payment.payment_method_id === 'pix') {
            // Para PIX, a correspondência é direta pelo ID do pagamento salvo na pré-ordem
            console.log(`[Webhook] Buscando pré-ordem para PIX com originalSessionId: ${paymentId}`);
            unverifiedQuery = await unverifiedOrdersRef.where('originalSessionId', '==', paymentId).limit(1).get();
        } else if (payment.metadata?.userId) {
            // Para Cartão, a correspondência é pelo ID do usuário e valor (fallback)
            const userId = payment.metadata.userId;
            const amount = payment.transaction_amount;
            console.log(`[Webhook] Buscando pré-ordem para Cartão para userId: ${userId} e valor: ${amount}`);
            
            const cardPreOrders = await unverifiedOrdersRef
                .where('userId', '==', userId)
                .where('paymentMethod', '==', 'card')
                .orderBy('createdAt', 'desc')
                .get();

             if (!cardPreOrders.empty) {
                // Encontra a correspondência mais próxima pelo valor
                const matchedDoc = cardPreOrders.docs.find(doc => 
                    Math.abs(doc.data().totalAmount - amount) < 0.01
                );
                if (matchedDoc) {
                     unverifiedQuery = { docs: [matchedDoc], empty: false } as admin.firestore.QuerySnapshot<admin.firestore.DocumentData>;
                }
             }
        } else {
            console.log(`[Webhook] Não foi possível determinar o método de busca da pré-ordem para o pagamento ${paymentId}.`);
        }

        // 3. CRIAR O PEDIDO FINAL SE A PRÉ-ORDEM FOR ENCONTRADA
        if (unverifiedQuery && !unverifiedQuery.empty) {
            const unverifiedOrderDoc = unverifiedQuery.docs[0];
            const unverifiedOrderData = unverifiedOrderDoc.data() as UnverifiedOrder;
            console.log(`[Webhook] Pré-ordem encontrada: ${unverifiedOrderDoc.id}. Processando...`);
            
            // Inicia um batch para garantir a atomicidade da operação
            const batch = db.batch();
            const finalOrderRef = db.collection(`users/${unverifiedOrderData.userId}/orders`).doc();
            
            const finalOrderData: Omit<Order, 'id'> = {
                userId: unverifiedOrderData.userId,
                customerInfo: unverifiedOrderData.customerInfo,
                items: unverifiedOrderData.items,
                orderDate: new Date().toISOString(),
                totalAmount: unverifiedOrderData.totalAmount,
                shippingAddress: unverifiedOrderData.shippingAddress,
                status: 'Pedido confirmado',
                paymentMethod: payment.payment_method_id === 'pix' ? 'pix' : 'credit_card',
                originalSessionId: paymentId, // Salva o ID do pagamento para idempotência
                couponCode: unverifiedOrderData.couponCode,
                discountAmount: unverifiedOrderData.discountAmount,
            };

            batch.set(finalOrderRef, finalOrderData);
            batch.delete(unverifiedOrderDoc.ref); // Remove a pré-ordem
            
            await batch.commit();
            console.log(`[Webhook] SUCESSO: Pedido ${finalOrderRef.id} criado a partir da pré-ordem ${unverifiedOrderDoc.id}.`);

        } else {
            console.log(`[Webhook] AVISO: Pagamento aprovado ${paymentId} recebido, mas nenhuma pré-ordem correspondente foi encontrada. O admin pode precisar confirmar manualmente.`);
        }
      } else {
        console.log(`[Webhook] Pagamento ${paymentId} não está com status 'approved'. Status atual: ${payment?.status}. Ignorando.`);
      }

    } catch (error: any) {
      console.error(`[Webhook] ❌ Erro ao processar notificação para pagamento ${paymentId}:`, error);
      // Retorna 500 para que o Mercado Pago possa tentar a notificação novamente
      return NextResponse.json({ error: 'Falha ao processar a notificação.' }, { status: 500 });
    }
  }

  // Retorna 200 OK para o Mercado Pago em todos os casos de sucesso ou de falha controlada
  return NextResponse.json({ received: true });
}
    