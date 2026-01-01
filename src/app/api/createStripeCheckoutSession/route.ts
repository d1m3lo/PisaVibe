
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
  typescript: true,
});

export async function POST(req: NextRequest) {
  try {
    const { items, userEmail, success_url, cancel_url } = await req.json();

    if (!items || !success_url || !cancel_url) {
      return NextResponse.json({ error: 'Parâmetros obrigatórios ausentes' }, { status: 400 });
    }

    const line_items = items.map((item: any) => ({
      price_data: {
        currency: 'brl',
        product_data: {
          name: item.displayName || item.name,
          images: item.imageUrl ? [item.imageUrl] : [],
          metadata: {
            productId: item.productId,
            variantId: item.variantId,
            size: item.size,
            variantColor: item.variantColor,
            selectedImage: item.selectedImage || ''
          },
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      metadata: {
        userEmail: userEmail,
        cartItems: JSON.stringify(items.map((item: any) => ({
            productId: item.productId,
            productName: item.displayName || item.name,
            variantId: item.variantId,
            variantColor: item.variantColor,
            size: item.size,
            quantity: item.quantity,
            price: item.price,
            imageUrl: item.imageUrl,
        })))
      },
      success_url: `${success_url}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['BR'],
      },
    });

    if (session.url) {
      return NextResponse.json({ url: session.url }, { status: 200 });
    } else {
       return NextResponse.json({ error: 'Não foi possível criar a sessão da Stripe.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Erro ao criar sessão Stripe:', error);
    return NextResponse.json(
      {
        error: 'Erro interno ao criar sessão de pagamento.',
        message: error.message
      },
      { status: 500 }
    );
  }
}
