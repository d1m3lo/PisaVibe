
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { cep: string } }
) {
  const { cep } = params;

  if (!cep || !/^\d{8}$/.test(cep)) {
    return NextResponse.json({ error: 'CEP inválido.' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    
    // A API do ViaCEP pode retornar 200 OK mesmo com um erro no corpo da resposta
    const data = await response.json();

    if (!response.ok && !data) {
        throw new Error('Falha ao buscar dados do ViaCEP. A resposta não foi bem-sucedida.');
    }
    
    if (data.erro) {
      return NextResponse.json({ error: 'CEP não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Erro na API de CEP:", error);
    return NextResponse.json({ error: 'Erro interno ao consultar o CEP.' }, { status: 500 });
  }
}
