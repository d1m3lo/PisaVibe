
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { cep: string } }
) {
  const cep = params.cep;

  if (!cep || !/^\d{8}$/.test(cep)) {
    return NextResponse.json({ error: 'CEP inválido.' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    
    if (!response.ok) {
        throw new Error('Falha ao buscar dados do ViaCEP.');
    }

    const data = await response.json();

    if (data.erro) {
      return NextResponse.json({ error: 'CEP não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Erro na API de CEP:", error);
    return NextResponse.json({ error: 'Erro interno ao consultar o CEP.' }, { status: 500 });
  }
}
