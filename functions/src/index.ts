
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
import { MercadoPagoConfig, Payment } from 'mercadopago';
import * as cors from 'cors';

// Carrega as variáveis de ambiente do .env localmente
import * as dotenv from 'dotenv';
dotenv.config();

// Inicializa o Firebase Admin SDK
admin.initializeApp();

// Configura o CORS para permitir requisições do seu frontend
const corsHandler = cors({ origin: true });

// Pega o Access Token (Secret Key) das variáveis de ambiente
const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

if (!accessToken) {
  logger.error(
    'MERCADO_PAGO_ACCESS_TOKEN não está definido nas variáveis de ambiente.'
  );
  throw new Error('Variável de ambiente MERCADO_PAGO_ACCESS_TOKEN faltando.');
}

// Inicializa o cliente do Mercado Pago
const client = new MercadoPagoConfig({ accessToken });
const payment = new Payment(client);

/**
 * Cloud Function para processar pagamentos do Mercado Pago.
 * Recebe os dados do pagamento do frontend e cria o pagamento de forma segura.
 */
export const processPayment = onRequest(
  { region: 'southamerica-east1' },
  (request, response) => {
    // Aplica o CORS para a requisição
    corsHandler(request, response, async () => {
      // Validação básica do corpo da requisição
      if (request.method !== 'POST') {
        response.status(405).send('Method Not Allowed');
        return;
      }
      if (!request.body.formData) {
        logger.error('Requisição sem formData.');
        response.status(400).json({ error: 'Dados do pagamento ausentes.' });
        return;
      }

      const paymentData = request.body.formData;
      logger.info('Recebendo dados para pagamento:', {
        data: paymentData,
      });

      try {
        // Cria o pagamento usando o SDK do Mercado Pago no backend
        const paymentResult = await payment.create({ body: paymentData });
        logger.info('Pagamento criado com sucesso:', {
          paymentId: paymentResult.id,
        });

        // Envia o resultado de volta para o frontend
        response.status(201).json(paymentResult);
      } catch (error: any) {
        logger.error('Erro ao processar pagamento:', error);

        // Retorna uma resposta de erro detalhada
        const errorMessage =
          error?.cause ?? 'Ocorreu um erro desconhecido no servidor.';
        response.status(500).json({
          error: 'Falha ao processar o pagamento.',
          details: errorMessage,
        });
      }
    });
  }
);
