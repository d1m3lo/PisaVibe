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
import EfiPay from 'efipay';
import * as cors from 'cors';
import * as path from 'path';

// Carrega as variáveis de ambiente do .env localmente
import * as dotenv from 'dotenv';
dotenv.config();

// Inicializa o Firebase Admin SDK
admin.initializeApp();

// Configura o CORS para permitir requisições do seu frontend
const corsHandler = cors({ origin: true });

// Configuração da Efí
const isProduction = process.env.NODE_ENV === 'production';

const efiOptions = {
  clientID: process.env.EFI_CLIENT_ID || '',
  clientSecret: process.env.EFI_CLIENT_SECRET || '',
  sandbox: !isProduction, // Mude para false em produção
  // O certificado é necessário para produção. Para sandbox, pode ser omitido.
  ...(isProduction && {
    certificate: path.join(__dirname, '../certs/production-cert.p12'),
  }),
};

if (!efiOptions.clientID || !efiOptions.clientSecret) {
  logger.error('Credenciais da Efí (clientID ou clientSecret) não definidas.');
  throw new Error('Credenciais da Efí faltando.');
}

const efiPay = new EfiPay(efiOptions);

/**
 * Cloud Function para criar uma cobrança Pix na Efí Pay.
 */
export const processPayment = onRequest(
  { region: 'southamerica-east1' },
  (request, response) => {
    corsHandler(request, response, async () => {
      if (request.method !== 'POST') {
        response.status(405).send('Method Not Allowed');
        return;
      }

      const { amount, customer } = request.body;

      if (!amount || !customer) {
        logger.error('Requisição sem "amount" ou "customer".');
        response.status(400).json({ error: 'Dados da cobrança ausentes.' });
        return;
      }

      logger.info('Recebendo dados para cobrança Pix:', { amount, customer });

      const body = {
        calendario: {
          expiracao: 3600, // Expira em 1 hora
        },
        devedor: {
          cpf: customer.cpf.replace(/\D/g, ''),
          nome: customer.name,
        },
        valor: {
          original: amount.toFixed(2),
        },
        chave: process.env.EFI_PIX_KEY || '', // Sua chave Pix cadastrada na Efí
        solicitacaoPagador: `Pedido na PISA VIBE - ${customer.name}`,
      };

      try {
        const pixCharge = await efiPay.pixCreateImmediateCharge(body);
        logger.info('Cobrança Pix criada com sucesso:', { txid: pixCharge.txid });

        const qrCode = await efiPay.pixGenerateQRCode({
          loc: { id: pixCharge.loc.id },
        });

        // Retorna o resultado para o frontend
        response.status(201).json({
          ...qrCode, // Contém qrcode (base64) e imagemQrcode (URL)
          txid: pixCharge.txid,
          payload: pixCharge.pixCopiaECola,
        });
      } catch (error: any) {
        logger.error('Erro ao criar cobrança Pix na Efí:', error?.response?.data || error);

        const errorMessage =
          error?.response?.data?.mensagem ||
          'Ocorreu um erro desconhecido no servidor.';
        response.status(500).json({
          error: 'Falha ao gerar a cobrança Pix.',
          details: errorMessage,
        });
      }
    });
  }
);


/**
 * Cloud Function para processar pagamentos com cartão de crédito via Efí Pay.
 */
export const processCardPayment = onRequest(
  { region: 'southamerica-east1' },
  (request, response) => {
    corsHandler(request, response, async () => {
      if (request.method !== 'POST') {
        response.status(405).send('Method Not Allowed');
        return;
      }
      
      const { amount, paymentToken, installments, customer } = request.body;

      if (!amount || !paymentToken || !installments || !customer) {
        logger.error('Dados incompletos para pagamento com cartão.', request.body);
        return response.status(400).json({ error: 'Dados do pagamento ausentes.' });
      }

      logger.info('Recebendo dados para pagamento com cartão:', { amount, installments, customer: customer.name });

      const chargeBody = {
        items: [{
          name: "Pedido PISA VIBE",
          value: Math.round(amount * 100), // Valor em centavos
          amount: 1
        }],
        payment: {
          credit_card: {
            installments,
            payment_token: paymentToken,
            customer: {
              name: customer.name,
              cpf: customer.cpf.replace(/\D/g, ''),
              email: customer.email,
            }
          }
        }
      };

      try {
        // "one step" cria e já executa o pagamento
        const chargeResult = await efiPay.createOneStepCharge(chargeBody);
        
        if (chargeResult.status === 'paid') {
           logger.info('Pagamento com cartão processado com sucesso:', { chargeId: chargeResult.charge_id });
           response.status(201).json({ success: true, ...chargeResult });
        } else {
          logger.warn('Pagamento com cartão não foi concluído:', { status: chargeResult.status, chargeId: chargeResult.charge_id });
          response.status(400).json({ 
            error: 'Pagamento não aprovado.', 
            details: `Status: ${chargeResult.status}`
          });
        }
      } catch (error: any) {
        logger.error('Erro ao processar pagamento com cartão na Efí:', error?.response?.data || error);

        const errorMessage =
          error?.response?.data?.mensagem ||
          'Ocorreu um erro desconhecido no servidor.';
        response.status(500).json({
          error: 'Falha ao processar o pagamento com cartão.',
          details: errorMessage,
        });
      }
    });
  }
);
