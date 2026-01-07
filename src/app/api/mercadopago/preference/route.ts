import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(req: Request) {
  try {
    const { items, email } = await req.json();

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: items.map((item: any) => ({
          title: item.product.name,
          quantity: item.quantity,
          unit_price: Number(item.product.price),
        })),
        payer: { email },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_SITE_URL}/minha-conta/pedidos`,
          failure: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout`,
          pending: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout`,
        },
        auto_return: "approved",
      },
    });

    return NextResponse.json({
      preferenceId: result.id,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao criar preferência Mercado Pago" },
      { status: 500 }
    );
  }
}
