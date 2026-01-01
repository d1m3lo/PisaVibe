
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import * as cors from 'cors';
import * as dotenv from 'dotenv';
import Stripe from 'stripe';

// Carrega as variáveis de ambiente do .env localmente
dotenv.config();

// Inicializa o Firebase Admin SDK
admin.initializeApp();

// Configura o CORS para permitir requisições do seu frontend
const corsHandler = cors({ origin: true });

// Inicializa o Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-06-20',
});


/**
 * Cloud Function para criar uma sessão de checkout no Stripe.
 */
export const createStripeCheckoutSession = onRequest(
  { region: 'southamerica-east1' },
  (request, response) => {
    corsHandler(request, response, async () => {
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
            response.status(201).json({ url: session.url });
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
