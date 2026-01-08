
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
    const { items, shippingInfo, coupon } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0 || !shippingInfo) {
      return NextResponse.json({ error: 'Dados obrigatórios ausentes ou inválidos.' }, { status: 400 });
    }
    
    // Verificação da estrutura dos itens
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
            ...item,
            // A descrição é adicionada aqui para ser exibida no Mercado Pago
            description: item.description || item.title
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
            success: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/sucesso`,
            failure: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/erro`,
            pending: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/pendente`,
        },
        auto_return: "approved",
        notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercadopago`,
        metadata: {
            shippingInfo: JSON.stringify(shippingInfo),
            // Salva os itens originais sem o desconto no metadado
            cartItems: JSON.stringify(items), 
            couponCode: coupon?.code || undefined,
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
