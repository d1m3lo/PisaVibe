-- ============================================================
-- PISA VIBE — Supabase PostgreSQL Schema
-- Migrado de: Firestore (Firebase) → PostgreSQL (Supabase)
-- ============================================================

-- Habilitar extensão para UUID
create extension if not exists "pgcrypto";

-- ============================================================
-- PRODUCTS
-- Firestore: products/{productId}
-- ============================================================
create table public.products (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text not null,
  image_url       text not null,
  price           numeric(10, 2) not null check (price >= 0),
  category        text not null,
  brand           text not null,
  sizes           text[] not null default '{}',
  colors          text[] not null default '{}',
  stock_quantity  int not null default 0 check (stock_quantity >= 0),
  is_imported     boolean not null default false,
  origin          text,
  image_names     text[] default '{}',
  created_at      timestamptz not null default now()
);

-- RLS: leitura pública, escrita apenas admin
alter table public.products enable row level security;
create policy "products_public_read"  on public.products for select using (true);
create policy "products_admin_write"  on public.products for all
  using (auth.jwt() ->> 'role' = 'admin');

create index idx_products_category on public.products(category);
create index idx_products_brand    on public.products(brand);
create index idx_products_price    on public.products(price);

-- ============================================================
-- USERS (perfil público)
-- Firestore: users/{userId}
-- Nota: id referencia auth.users.id do Supabase Auth
-- ============================================================
create table public.users (
  id                   uuid primary key references auth.users(id) on delete cascade,
  name                 text not null,
  email                text not null unique,
  address              text,
  phone                text,
  points               int not null default 0 check (points >= 0),
  reviewed_product_ids uuid[] not null default '{}',
  created_at           timestamptz not null default now()
);

-- RLS: usuário acessa somente o próprio registro
alter table public.users enable row level security;
create policy "users_self_read"  on public.users for select using (auth.uid() = id);
create policy "users_self_write" on public.users for update using (auth.uid() = id);

-- Trigger: cria perfil automaticamente após signup no Supabase Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- ORDERS
-- Firestore: users/{userId}/orders/{orderId}
-- Migrado para tabela plana com FK — queries SQL diretas
-- ============================================================
create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  order_date       timestamptz not null default now(),
  total_amount     numeric(10, 2) not null check (total_amount >= 0),
  shipping_address text not null,
  status           text not null default 'pending'
                     check (status in ('pending','processing','shipped','delivered','cancelled')),
  coupon_code      text,
  discount_amount  numeric(10, 2) not null default 0
);

-- RLS: usuário acessa somente os próprios pedidos
alter table public.orders enable row level security;
create policy "orders_self_read"  on public.orders for select using (auth.uid() = user_id);
create policy "orders_self_insert" on public.orders for insert with check (auth.uid() = user_id);

create index idx_orders_user_id   on public.orders(user_id);
create index idx_orders_status    on public.orders(status);
create index idx_orders_date      on public.orders(order_date desc);

-- ============================================================
-- ORDER ITEMS
-- Firestore: users/{userId}/orders/{orderId}/orderItems/{id}
-- Migrado para tabela plana com FKs
-- ============================================================
create table public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  uuid not null references public.products(id),
  quantity    int not null check (quantity > 0),
  price       numeric(10, 2) not null check (price >= 0),
  size        text,
  color       text
);

-- RLS: acesso via JOIN com orders
alter table public.order_items enable row level security;
create policy "order_items_self_read" on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

create index idx_order_items_order_id   on public.order_items(order_id);
create index idx_order_items_product_id on public.order_items(product_id);

-- ============================================================
-- PRODUCT RECOMMENDATIONS
-- Firestore: users/{userId}/productRecommendations/{id}
-- ============================================================
create table public.product_recommendations (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users(id) on delete cascade,
  product_id          uuid not null references public.products(id) on delete cascade,
  score               numeric(5, 4) not null check (score >= 0 and score <= 1),
  recommendation_date timestamptz not null default now()
);

-- RLS: usuário acessa somente as próprias recomendações
alter table public.product_recommendations enable row level security;
create policy "recommendations_self_read" on public.product_recommendations for select
  using (auth.uid() = user_id);

create index idx_recommendations_user_id on public.product_recommendations(user_id);
create index idx_recommendations_score   on public.product_recommendations(score desc);

-- ============================================================
-- COUPONS
-- Firestore: coupons/{couponId}
-- ============================================================
create table public.coupons (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  discount_type   text not null check (discount_type in ('percentage', 'fixed')),
  discount_value  numeric(10, 2) not null check (discount_value > 0),
  expiry_date     timestamptz,
  is_active       boolean not null default true
);

-- RLS: leitura pública para cupons ativos, escrita admin
alter table public.coupons enable row level security;
create policy "coupons_public_read" on public.coupons for select using (is_active = true);
create policy "coupons_admin_write" on public.coupons for all
  using (auth.jwt() ->> 'role' = 'admin');

create index idx_coupons_code      on public.coupons(code);
create index idx_coupons_is_active on public.coupons(is_active);
