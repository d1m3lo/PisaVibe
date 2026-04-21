# PISA VIBE

Loja online de tênis e roupas com estilo minimalista.

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + React 19 + TailwindCSS
- **Backend/Database**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Payments**: MercadoPago
- **AI**: Google Genkit
- **UI Components**: shadcn/ui + Radix UI
- **Deployment**: Vercel (ou qualquer host compatível com Next.js)

## Getting Started

1. Clone o repositório
2. Copie `.env.local.example` para `.env.local` e preencha suas variáveis
3. Instale as dependências:

```bash
npm install
```

4. Rode o servidor de desenvolvimento:

```bash
npm run dev
```

O app estará disponível em [http://localhost:9002](http://localhost:9002).

## Estrutura do Projeto

```
src/
├── app/          # Rotas e páginas (Next.js App Router)
├── components/   # Componentes React reutilizáveis
├── context/      # Context providers (cart, etc.)
├── hooks/        # Custom hooks
├── lib/          # Utilitários e helpers
├── supabase/     # Clients Supabase (browser, server, service role)
└── ai/           # Configuração Genkit/AI
```

## Supabase Setup

O projeto usa Supabase para:
- **Auth**: Autenticação com email/senha
- **Database**: PostgreSQL para produtos, pedidos, cupons, banners, etc.
- **Realtime**: Subscriptions para atualizações em tempo real
- **RLS**: Row Level Security para controle de acesso

## Scripts

- `npm run dev` — Servidor de desenvolvimento (porta 9002)
- `npm run build` — Build de produção
- `npm start` — Servidor de produção
- `npm run lint` — Linting
- `npm run typecheck` — Verificação de tipos TypeScript
