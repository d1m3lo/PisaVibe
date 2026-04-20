# **App Name**: PISA VIBE

## Stack de Backend

| Camada | Tecnologia |
|---|---|
| Banco de dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth + Next Auth v5 |
| Storage de arquivos | Supabase Storage |
| Background jobs | Inngest |
| E-mail transacional | Resend |
| Pagamentos | MercadoPago (mantido) |
| IA / Recomendações | Genkit + Google GenAI (mantido) |

---

## Core Features

### Catálogo de Produtos
Exibição de tênis e roupas com fotos, descrição e preços.
- Dados lidos da tabela `products` via `@supabase/supabase-js`
- Imagens servidas pelo Supabase Storage (bucket `product-images`)
- Filtros por categoria, marca e faixa de preço usando queries SQL nativas

### Carrinho de Compras
Adicionar produtos ao carrinho, visualizar e ajustar a quantidade.
- Estado mantido localmente com `useState` / `localStorage` no cliente
- Persistência opcional na tabela `cart_items` para usuários autenticados

### Checkout
Processo de finalização da compra com informações de entrega e pagamento.
- Integração com MercadoPago (SDK `@mercadopago/sdk-react` + `mercadopago`)
- Webhook de confirmação em `POST /api/webhooks/mercadopago` (Route Handler Next.js)
- Atualização de status do pedido via Inngest (`on-payment-webhook`)

### Busca de Produtos
Permitir que os usuários pesquisem produtos por nome, categoria ou marca.
- Full-text search com `to_tsvector` / `to_tsquery` do PostgreSQL via Supabase
- Alternativa: Supabase `ilike` para buscas simples

### Login / Registro de Usuário
Autenticação de usuários para salvar informações de entrega e histórico de pedidos.
- **Supabase Auth** substitui Firebase Auth
  - Email + senha: `supabase.auth.signUp()` / `signInWithPassword()`
  - Google OAuth: `supabase.auth.signInWithOAuth({ provider: 'google' })`
- Sessão gerenciada server-side com `@supabase/ssr` + middleware Next.js
- Trigger PostgreSQL cria registro em `public.users` automaticamente após signup

### Recomendação de Produtos
Recomendações personalizadas via IA com histórico de compras e visualizações.
- Geradas pelo **Genkit + Google GenAI** (sem alteração)
- Salvas na tabela `product_recommendations` (substituiu subcoleção Firestore)
- Job diário agendado via **Inngest** — sem Firebase Functions

---

## Style Guidelines

- Cor primária: Cinza claro (`#D3D3D3`) para um fundo neutro e elegante
- Cor de fundo: Branco (`#FFFFFF`) para criar um contraste nítido com os produtos
- Cor de destaque: Preto (`#000000`) para títulos, texto e elementos interativos
- Fonte: `Inter` — sans-serif moderna para corpo e títulos
- Ícones minimalistas em preto e branco para navegação e elementos de interface
- Design limpo e minimalista com espaçamento adequado para destacar os produtos
- Transições sutis e elegantes ao interagir com produtos e elementos da página
