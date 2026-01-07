
import * as functions from "firebase-functions";
import { MercadoPagoConfig, Payment } from "mercadopago";

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
