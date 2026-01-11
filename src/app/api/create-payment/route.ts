
import { NextResponse, type NextRequest } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import type { Coupon } from '@/lib/types';
import dotenv from 'dotenv';

dotenv.config();

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
  throw new Error("MERCADOPAGO_ACCESS_TOKEN não está definida no ambiente.");
}

const client = new MercadoPagoConfig({ 
    accessToken,
});

export async function POST(req: NextRequest) {
  try {
    const { items, shippingInfo, coupon, userId } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0 || !shippingInfo || !userId) {
      return NextResponse.json({ error: 'Dados obrigatórios ausentes ou inválidos.' }, { status: 400 });
    }
    
    const areItemsValid = items.every(
      (item: any) =>
        typeof item.title === 'string' &&
        typeof item.quantity === 'number' &&
        typeof item.unit_price === 'number'
    );

    if (!areItemsValid) {
        return NextResponse.json({ error: 'Formato dos itens do carrinho é inválido.' }, { status: 400 });
    }

    const totalAmount = items.reduce((acc: number, item: any) => acc + item.quantity * item.unit_price, 0);
    let discount = 0;
    
    if (coupon) {
      if (coupon.discountType === 'percentage') {
        discount = totalAmount * (coupon.discountValue / 100);
      } else {
        discount = coupon.discountValue;
      }
    }
    
    const finalItems = [...items];
    if (discount > 0) {
      finalItems.push({
        id: 'discount',
        title: `Desconto (${coupon.code})`,
        unit_price: -discount,
        quantity: 1,
        description: 'Cupom de desconto aplicado'
      });
    }

    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: finalItems.map(item => ({
            id: item.id,
            title: item.title,
            quantity: item.quantity,
            unit_price: item.unit_price,
            description: item.description || item.title,
            picture_url: item.picture_url,
        })),
        payer: {
          name: shippingInfo.name,
          email: shippingInfo.email,
          phone: {
            number: shippingInfo.phone,
          },
          address: {
            street_name: shippingInfo.street,
            street_number: shippingInfo.number,
            zip_code: shippingInfo.zipCode,
          }
        },
        back_urls: {
            success: "https://pisavibe.shop/pagamento/retorno",
            failure: "https://pisavibe.shop/pagamento/retorno",
            pending: "https://pisavibe.shop/pagamento/retorno",
        },
        auto_return: "approved",
        notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercadopago`,
        metadata: {
            userId: userId,
            shippingInfo: JSON.stringify(shippingInfo),
            cartItems: JSON.stringify(items.map(item => ({
                id: item.id,
                title: item.title,
                quantity: item.quantity,
                unit_price: item.unit_price,
                description: item.description,
                picture_url: item.picture_url
            }))),
            couponCode: coupon?.code,
            discountAmount: discount > 0 ? discount : undefined,
        },
      }
    });

    return NextResponse.json({ preferenceId: result.id }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao criar preferência de pagamento:', error);
    const errorMessage = error.cause?.message || error.message || 'Erro interno ao criar preferência de pagamento.';
    const errorDetails = error.cause?.error || null;
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}
