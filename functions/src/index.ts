
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import { onRequest } from 'firebase-functions/v2/https';
import { defineString } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import * as cors from 'cors';
import Stripe from 'stripe';

// Inicializa o Firebase Admin SDK
admin.initializeApp();

// Configura o CORS para permitir requisições do seu frontend
const corsHandler = cors({ origin: true });

// Define a chave secreta da Stripe usando a forma segura recomendada pelo Firebase.
// O valor será obtido do ambiente de produção ou de um arquivo .envrc local.
const stripeSecretKey = defineString('STRIPE_SECRET_KEY');

/**
 * Cloud Function para criar uma sessão de checkout no Stripe.
 */
export const createStripeCheckoutSession = onRequest(
  { region: 'southamerica-east1', secrets: ['STRIPE_SECRET_KEY'] },
  (request, response) => {
    corsHandler(request, response, async () => {
      // Inicializa a Stripe DENTRO da função, usando o valor seguro.
      const stripe = new Stripe(stripeSecretKey.value(), {
        apiVersion: '2024-06-20',
      });

      if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method Not Allowed' });
        return;
      }

      logger.info('Iniciando criação de sessão de checkout. Body:', request.body);

      const { items, userEmail, success_url, cancel_url } = request.body;

      if (!items || !success_url || !cancel_url) {
        logger.error('Requisição sem "items", "success_url" ou "cancel_url".');
        response.status(400).json({ error: 'Dados da cobrança ausentes.' });
        return;
      }
      
      try {
        const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item: any) => ({
            price_data: {
                currency: 'brl',
                product_data: {
                    name: item.displayName || item.name,
                    images: [item.imageUrl],
                    metadata: {
                      productId: item.productId,
                      variantId: item.variantId,
                      size: item.size
                    }
                },
                unit_amount: Math.round(item.price * 100), // Preço em centavos
            },
            quantity: item.quantity,
        }));
        
        logger.info('Line items para a Stripe:', { line_items: JSON.stringify(line_items) });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'pix'],
            line_items,
            mode: 'payment',
            success_url,
            cancel_url,
            customer_email: userEmail,
            billing_address_collection: 'required',
            shipping_address_collection: {
                allowed_countries: ['BR'],
            }
        });

        if (session.url) {
            logger.info('Sessão de checkout criada com sucesso:', { sessionId: session.id });
            response.status(200).json({ url: session.url });
        } else {
             // Garante que um erro JSON seja retornado se a URL não existir
             throw new Error('Não foi possível obter a URL da sessão de checkout.');
        }

      } catch (error: any) {
        logger.error('Erro ao criar sessão de checkout no Stripe:', error);
        // Sempre retorna um erro em formato JSON
        response.status(500).json({
          error: 'Falha ao iniciar o pagamento.',
          details: error.message,
        });
      }
    });
  }
);
