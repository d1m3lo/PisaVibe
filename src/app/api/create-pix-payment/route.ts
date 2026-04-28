
import { NextResponse, type NextRequest } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
  throw new Error("MERCADOPAGO_ACCESS_TOKEN não está definida no ambiente.");
}

const client = new MercadoPagoConfig({ accessToken });

export async function POST(req: NextRequest) {
  try {
    const { amount, email } = await req.json();

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Valor (amount) inválido.' }, { status: 400 });
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
    }

    const payment = new Payment(client);

    const result = await payment.create({
      body: {
        transaction_amount: amount,
        description: 'Pedido PISA VIBE',
        payment_method_id: 'pix',
        payer: {
          email: email,
        },
      },
    });

    if (!result.id) {
      throw new Error('Falha ao criar pagamento PIX no Mercado Pago.');
    }

    const pixInfo = result.point_of_interaction?.transaction_data;

    if (!pixInfo?.qr_code || !pixInfo?.qr_code_base64) {
      throw new Error('Dados do QR Code PIX não retornados pelo Mercado Pago.');
    }

    return NextResponse.json({
      payment_id: String(result.id),
      qr_code: pixInfo.qr_code,
      qr_code_base64: pixInfo.qr_code_base64,
      ticket_url: pixInfo.ticket_url,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao criar pagamento PIX:', error);
    const errorMessage = error.cause?.message || error.message || 'Erro interno ao criar pagamento PIX.';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
