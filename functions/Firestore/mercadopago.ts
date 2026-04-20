import { MercadoPagoConfig, Payment } from "mercadopago";

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
  console.error("MERCADOPAGO_ACCESS_TOKEN não está definida no ambiente.");
  throw new Error("Credencial do Mercado Pago não encontrada.");
}

export const mpClient = new MercadoPagoConfig({ accessToken });
export const mpPayment = new Payment(mpClient);