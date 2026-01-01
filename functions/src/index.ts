import { onRequest } from 'firebase-functions/v2/https';
import { defineString } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import * as cors from 'cors';
import Stripe from 'stripe';

admin.initializeApp();

const corsHandler = cors({ origin: true });

const stripeSecretKey = defineString('STRIPE_SECRET_KEY');

export const createStripeCheckoutSession = onRequest(
  { region: 'southamerica-east1', secrets: ['STRIPE_SECRET_KEY'] },
  async (req, res) => {
    corsHandler(req, res, async () => {
      try {
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Método não permitido' });
        }

        const stripe = new Stripe(stripeSecretKey.value(), {
          apiVersion: '2024-06-20',
        });

        const { items, userEmail, success_url, cancel_url } = req.body || {};

        if (!items || !success_url || !cancel_url) {
          return res.status(400).json({
            error: 'Parâmetros obrigatórios ausentes',
          });
        }

        const line_items = items.map((item: any) => ({
          price_data: {
            currency: 'brl',
            product_data: {
              name: item.displayName || item.name,
              images: item.imageUrl ? [item.imageUrl] : [],
              metadata: {
                productId: item.productId,
                variantId: item.variantId,
                size: item.size,
              },
            },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card', 'pix'],
          mode: 'payment',
          line_items,
          customer_email: userEmail,
          success_url,
          cancel_url,
          billing_address_collection: 'required',
          shipping_address_collection: {
            allowed_countries: ['BR'],
          },
        });

        return res.status(200).json({ url: session.url });
      } catch (error: any) {
        logger.error('Erro ao criar sessão Stripe:', error);

        return res.status(500).json({
          error: 'Erro interno ao criar sessão de pagamento.',
          message: error?.message || 'Erro desconhecido',
        });
      }
    });
  }
);
