import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(req: Request) {
  try {
    const { items, email, shippingInfo, couponCode, discountAmount } =
      await req.json();

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: items.map((item: any) => ({
          id: item.product.id,
          title: item.product.name,
          quantity: item.quantity,
          unit_price: Number(item.product.price),
          description: `${item.product.color} / ${item.product.size}`,
          picture_url: item.product.imageUrl,
        })),

        payer: { email },

        // ✅ METADATA NO FORMATO QUE O SEU WEBHOOK ESPERA
        metadata: {
          shippingInfo: JSON.stringify({
            name: shippingInfo.name,
            email: email,
            phone: shippingInfo.phone,
            street: shippingInfo.street,
            number: shippingInfo.number,
            complement: shippingInfo.complement || "",
            neighborhood: shippingInfo.neighborhood,
            city: shippingInfo.city,
            state: shippingInfo.state,
            zipCode: shippingInfo.zipCode,
          }),

          cartItems: JSON.stringify(
            items.map((item: any) => ({
              id: item.product.id,
              title: item.product.name,
              quantity: item.quantity,
              unit_price: Number(item.product.price),
              description: `${item.product.color} / ${item.product.size}`,
              picture_url: item.product.imageUrl,
            }))
          ),

          couponCode: couponCode || "",
          discountAmount: discountAmount || 0,
        },

        // ✅ WEBHOOK
        notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/mercadopago`,

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
