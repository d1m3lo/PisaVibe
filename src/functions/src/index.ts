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
import { MercadoPagoConfig, Payment } from 'mercadopago';

// Inicializa o Firebase Admin SDK
admin.initializeApp();

const corsHandler = cors({ origin: true });

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
  logger.error("MERCADOPAGO_ACCESS_TOKEN não está definida no ambiente.");
  throw new Error("MERCADOPAGO_ACCESS_TOKEN não está definida no ambiente.");
}

const client = new MercadoPagoConfig({ accessToken });

export const createPixPayment = onRequest(
  { region: 'southamerica-east1' },
  (request, response) => {
    corsHandler(request, response, async () => {
      if (request.method !== 'POST') {
        response.status(405).send('Method Not Allowed');
        return;
      }

      const { items, customer, coupon } = request.body;
      if (!items || items.length === 0 || !customer) {
        response.status(400).json({ error: 'Dados da cobrança ausentes.' });
        return;
      }

      let totalAmount = items.reduce((acc: number, item: any) => acc + item.quantity * item.unit_price, 0);
      let discount = 0;
      if (coupon) {
        if (coupon.discountType === 'percentage') {
          discount = totalAmount * (coupon.discountValue / 100);
        } else {
          discount = coupon.discountValue;
        }
      }
      totalAmount -= discount;
      if (totalAmount < 0) totalAmount = 0;

      const payment_data = {
        transaction_amount: totalAmount,
        description: `Pedido na PISA VIBE - ${customer.name}`,
        payment_method_id: 'pix',
        payer: {
          email: customer.email,
          first_name: customer.name.split(' ')[0],
          last_name: customer.name.split(' ').slice(1).join(' '),
        },
      };

      try {
        const payment = new Payment(client);
        const result = await payment.create({ body: payment_data });

        if (result && result.point_of_interaction) {
          const pixData = result.point_of_interaction.transaction_data;
          response.status(201).json({
            payment_id: result.id,
            status: result.status,
            qr_code_base64: pixData.qr_code_base64,
            qr_code: pixData.qr_code,
            expires: result.date_of_expiration
          });
        } else {
            throw new Error("Resposta inesperada do Mercado Pago.");
        }
      } catch (error: any) {
        logger.error('Erro ao criar pagamento PIX no Mercado Pago:', error?.cause || error);
        const errorMessage = error?.cause?.message || 'Falha ao gerar a cobrança PIX.';
        response.status(500).json({ error: errorMessage, details: error?.cause?.error });
      }
    });
  }
);
