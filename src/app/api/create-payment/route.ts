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
    const { items, payer, coupon } = await req.json();

    if (!items || !payer) {
      return NextResponse.json({ error: 'Dados obrigatórios ausentes' }, { status: 400 });
    }
    
    // Calcula o desconto
    const totalAmount = items.reduce((acc: number, item: any) => acc + item.quantity * item.unit_price, 0);
    let discount = 0;
    if (coupon) {
      if (coupon.discountType === 'percentage') {
        discount = totalAmount * (coupon.discountValue / 100);
      } else {
        discount = coupon.discountValue;
      }
    }
    // Aplica o desconto como um item negativo na preferência
    if (discount > 0) {
      items.push({
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
        items: items,
        payer: {
          name: payer.name,
          email: payer.email,
        },
        back_urls: {
            success: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout`,
            failure: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout`,
            pending: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout`,
        },
        auto_return: "approved",
        notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercadopago`,
        metadata: {
            userEmail: payer.email,
            cartItems: JSON.stringify(items.filter((i:any) => i.id !== 'discount')), // Salva o carrinho original
            couponCode: coupon?.code || undefined,
            discountAmount: coupon ? discount : undefined,
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
