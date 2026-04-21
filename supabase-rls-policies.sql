-- ============================================================
-- PISA VIBE — Supabase Row Level Security (RLS) Policies
-- Equivalent to the original firestore.rules
-- Run this in Supabase SQL Editor after creating your tables
-- ============================================================

-- Admin UIDs (replace with your Supabase user UUIDs)
-- Firebase UIDs:
--   QZavnE0270YjhMHsyQOb7FBzFSK2
--   UaoQYEmCthasXz2UQlAEhHWZCGE2
-- 
-- You need to find the corresponding Supabase UUIDs for these users
-- and update the function below.

-- ─── Helper function: is_admin ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT auth.uid() IN (
    -- TODO: Replace with your Supabase admin user UUIDs
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid
  );
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PRODUCTS
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Anyone can read products
CREATE POLICY "products_select_public"
  ON public.products FOR SELECT
  USING (true);

-- Only admins can insert/update/delete products
CREATE POLICY "products_insert_admin"
  ON public.products FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "products_update_admin"
  ON public.products FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "products_delete_admin"
  ON public.products FOR DELETE
  USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════════
-- BANNERS
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Anyone can read banners
CREATE POLICY "banners_select_public"
  ON public.banners FOR SELECT
  USING (true);

-- Only admins can manage banners
CREATE POLICY "banners_insert_admin"
  ON public.banners FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "banners_update_admin"
  ON public.banners FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "banners_delete_admin"
  ON public.banners FOR DELETE
  USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════════
-- UNVERIFIED ORDERS (Aguardando aprovação do admin)
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.unverified_orders ENABLE ROW LEVEL SECURITY;

-- Admins can read/write
CREATE POLICY "unverified_orders_select_admin"
  ON public.unverified_orders FOR SELECT
  USING (public.is_admin());

CREATE POLICY "unverified_orders_update_admin"
  ON public.unverified_orders FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "unverified_orders_delete_admin"
  ON public.unverified_orders FOR DELETE
  USING (public.is_admin());

-- Authenticated users can create
CREATE POLICY "unverified_orders_insert_authenticated"
  ON public.unverified_orders FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ═══════════════════════════════════════════════════════════════════════════════
-- USERS
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Admins can list all users
CREATE POLICY "users_select_admin"
  ON public.users FOR SELECT
  USING (public.is_admin());

-- Users can read their own profile
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can create their own profile
CREATE POLICY "users_insert_own"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- No deletes allowed
-- (No DELETE policy = no one can delete)

-- ═══════════════════════════════════════════════════════════════════════════════
-- ORDERS (linked to users via user_id column)
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Admins can read all orders
CREATE POLICY "orders_select_admin"
  ON public.orders FOR SELECT
  USING (public.is_admin());

-- Users can read their own orders
CREATE POLICY "orders_select_own"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can manage all orders
CREATE POLICY "orders_insert_admin"
  ON public.orders FOR INSERT
  WITH CHECK (public.is_admin() OR auth.uid() = user_id);

CREATE POLICY "orders_update_admin"
  ON public.orders FOR UPDATE
  USING (public.is_admin() OR auth.uid() = user_id);

CREATE POLICY "orders_delete_admin"
  ON public.orders FOR DELETE
  USING (public.is_admin() OR auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- COUPONS
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Admins can manage coupons
CREATE POLICY "coupons_all_admin"
  ON public.coupons FOR ALL
  USING (public.is_admin());

-- Authenticated users can read coupons (to apply them)
CREATE POLICY "coupons_select_authenticated"
  ON public.coupons FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ACCESS LOGS
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can create access logs
CREATE POLICY "access_logs_insert_public"
  ON public.access_logs FOR INSERT
  WITH CHECK (true);

-- Only admins can read/update/delete access logs
CREATE POLICY "access_logs_select_admin"
  ON public.access_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "access_logs_update_admin"
  ON public.access_logs FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "access_logs_delete_admin"
  ON public.access_logs FOR DELETE
  USING (public.is_admin());
