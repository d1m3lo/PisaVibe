
import * as functions from "firebase-functions";
import { MercadoPagoConfig, Payment } from "mercadopago";
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

/* ================================
   MERCADO PAGO CLIENT
================================ */
const client = new MercadoPagoConfig({
  accessToken: "APP_USR-4471136097030537-122919-8fbdd981af51d484d5cc90907b5574ba-481737354",
});

const payment = new Payment(client);

/* ================================
   CRIAR PAGAMENTO PIX
================================ */
export const createPixPayment = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Método não permitido" });
    return;
  }

  try {
    const { amount, email } = req.body;

    if (!amount || !email) {
      res.status(400).json({ error: "Dados inválidos" });
      return;
    }

    const result = await payment.create({
      body: {
        transaction_amount: Number(amount),
        payment_method_id: "pix",
        description: "Pagamento PIX - PisaVibe",
        payer: { email },
      },
    });

    const pix = result.point_of_interaction?.transaction_data;

    res.status(200).json({
      payment_id: result.id,
      status: result.status,
      qr_code: pix.qr_code,
      qr_code_base64: pix.qr_code_base64,
    });
  } catch (error) {
    console.error("Erro ao gerar PIX:", error);
    res.status(500).json({ error: "Erro ao gerar PIX" });
  }
});


/* ================================
   LOG DE ACESSOS
================================ */
export const logAccess = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    await db.collection('access_logs').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(200).send('Access logged');
  } catch (error) {
    console.error('Error logging access:', error);
    res.status(500).send('Error logging access');
  }
});
