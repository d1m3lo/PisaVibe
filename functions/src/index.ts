import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { MercadoPagoConfig, Payment } from "mercadopago";

admin.initializeApp();
const db = admin.firestore();

/* ================================
   MERCADO PAGO CLIENT
================================ */
const client = new MercadoPagoConfig({
  accessToken: "APP_USR-XXXXXXXXXXXXXXXXXXXXXXXXXXXX",
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
    const { amount, email, items, shippingInfo, userId } = req.body;

    if (!amount || !email || !items || !userId) {
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

    const orderRef = db
      .collection("users")
      .doc(userId)
      .collection("orders")
      .doc(String(result.id));

    await orderRef.set({
      userId,
      email,
      items,
      shippingInfo,
      paymentId: result.id,
      paymentMethod: "pix",
      status: "pending",
      amount,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

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
   WEBHOOK MERCADO PAGO
================================ */
export const mercadoPagoWebhook = functions.https.onRequest(
  async (req, res) => {
    try {
      const paymentId = req.body?.data?.id;
      if (!paymentId) {
        res.status(200).send("OK");
        return;
      }

      const mpPayment = await payment.get({ id: paymentId });
      const status = mpPayment.status;
      const userId = mpPayment.metadata?.user_id;

      if (!userId) {
        console.warn("Webhook sem userId");
        res.status(200).send("OK");
        return;
      }

      const orderRef = db
        .collection("users")
        .doc(userId)
        .collection("orders")
        .doc(String(paymentId));

      await orderRef.update({
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log("Pedido atualizado:", paymentId, status);
      res.status(200).send("OK");
    } catch (error) {
      console.error("Erro no webhook:", error);
      res.status(500).send("Erro");
    }
  }
);
