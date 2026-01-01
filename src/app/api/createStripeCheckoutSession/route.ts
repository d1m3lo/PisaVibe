
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';

// A chave secreta é lida diretamente das variáveis de ambiente do servidor.
// Em produção (App Hosting), você definirá isso como um "Secret".
// Em desenvolvimento, você pode criar um arquivo .env.local na raiz do projeto.
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
      customer_email: userEmail,
      success_url,
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
