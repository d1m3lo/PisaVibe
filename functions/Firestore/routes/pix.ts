import { Router, Request, Response } from "express";
import { mpPayment } from "../lib/mercadopago";

const router = Router();

/**
 * POST /pix
 *
 * Substitui: functions.https.onRequest → createPixPayment
 * Gera um pagamento PIX via MercadoPago e retorna QR code.
 *
 * Body: { amount: number, email: string }
 */
router.post("/", async (req: Request, res: Response) => {
  const { amount, email } = req.body;

  if (!amount || !email) {
    res.status(400).json({ error: "Dados inválidos: amount e email são obrigatórios." });
    return;
  }

  try {
    const result = await mpPayment.create({
      body: {
        transaction_amount: Number(amount),
        payment_method_id: "pix",
        description: "Pagamento PIX - PisaVibe",
        payer: { email },
      },
    });

    const pix = result.point_of_interaction?.transaction_data;

    if (!pix) {
      throw new Error("Resposta inesperada do Mercado Pago ao gerar PIX.");
    }

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

export default router;