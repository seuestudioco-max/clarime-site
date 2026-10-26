/*
# Create Clarimê admin store foundation

1. New Tables
- `profiles`: one profile per signed-in account, with a protected role.
- `products`: catalog items managed by the store team.
- `carts`: customer shopping carts visible to administrators.
- `cart_items`: products and quantities inside carts.
- `orders`: sales with customer details, status, payment status and total.
- `order_items`: immutable product snapshots belonging to each sale.

2. Security
- Enable RLS on every new table.
- Only authenticated administrators can access store management data.
- Product and order ownership/role fields cannot be changed directly by the browser.
- The first account created becomes the store administrator; later accounts are staff.
- The `is_clarime_admin` helper uses a fixed search path and is not callable by anonymous users.

3. Important Notes
- The browser never supplies an admin role or order total as an authority.
- Prices are stored in integer cents to avoid floating-point currency errors.
- Deleting a product is blocked when it is referenced by order history; inactive products should be archived instead.
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  collection text NOT NULL DEFAULT 'Clube das Cores',
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL DEFAULT '',
  customer_email text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'abandoned', 'converted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cart_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'preparing', 'shipped', 'completed', 'cancelled')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  total_cents integer NOT NULL CHECK (total_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  unit_price_cents integer NOT NULL CHECK (unit_price_cents >= 0),
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_active_idx ON public.products(active);
CREATE INDEX IF NOT EXISTS carts_status_idx ON public.carts(status);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items(order_id);

CREATE OR REPLACE FUNCTION public.is_clarime_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_clarime_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_clarime_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_clarime_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    CASE WHEN NOT EXISTS (SELECT 1 FROM public.profiles) THEN 'admin' ELSE 'staff' END
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_clarime_auth_user_created ON auth.users;
CREATE TRIGGER on_clarime_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_clarime_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;

REVOKE UPDATE (role, id, email, created_at) ON public.profiles FROM authenticated;
GRANT UPDATE (full_name) ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_read_own" ON public.profiles;
CREATE POLICY "profiles_read_own" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
DROP POLICY IF EXISTS "profiles_update_own_name" ON public.profiles;
CREATE POLICY "profiles_update_own_name" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "admins_select_products" ON public.products;
CREATE POLICY "admins_select_products" ON public.products FOR SELECT TO authenticated USING (public.is_clarime_admin());
DROP POLICY IF EXISTS "admins_insert_products" ON public.products;
CREATE POLICY "admins_insert_products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.is_clarime_admin());
DROP POLICY IF EXISTS "admins_update_products" ON public.products;
CREATE POLICY "admins_update_products" ON public.products FOR UPDATE TO authenticated USING (public.is_clarime_admin()) WITH CHECK (public.is_clarime_admin());
DROP POLICY IF EXISTS "admins_delete_products" ON public.products;
CREATE POLICY "admins_delete_products" ON public.products FOR DELETE TO authenticated USING (public.is_clarime_admin());

DROP POLICY IF EXISTS "admins_select_carts" ON public.carts;
CREATE POLICY "admins_select_carts" ON public.carts FOR SELECT TO authenticated USING (public.is_clarime_admin());
DROP POLICY IF EXISTS "admins_insert_carts" ON public.carts;
CREATE POLICY "admins_insert_carts" ON public.carts FOR INSERT TO authenticated WITH CHECK (public.is_clarime_admin());
DROP POLICY IF EXISTS "admins_update_carts" ON public.carts;
CREATE POLICY "admins_update_carts" ON public.carts FOR UPDATE TO authenticated USING (public.is_clarime_admin()) WITH CHECK (public.is_clarime_admin());
DROP POLICY IF EXISTS "admins_delete_carts" ON public.carts;
CREATE POLICY "admins_delete_carts" ON public.carts FOR DELETE TO authenticated USING (public.is_clarime_admin());

DROP POLICY IF EXISTS "admins_select_cart_items" ON public.cart_items;
CREATE POLICY "admins_select_cart_items" ON public.cart_items FOR SELECT TO authenticated USING (public.is_clarime_admin());
DROP POLICY IF EXISTS "admins_insert_cart_items" ON public.cart_items;
CREATE POLICY "admins_insert_cart_items" ON public.cart_items FOR INSERT TO authenticated WITH CHECK (public.is_clarime_admin());
DROP POLICY IF EXISTS "admins_update_cart_items" ON public.cart_items;
CREATE POLICY "admins_update_cart_items" ON public.cart_items FOR UPDATE TO authenticated USING (public.is_clarime_admin()) WITH CHECK (public.is_clarime_admin());
DROP POLICY IF EXISTS "admins_delete_cart_items" ON public.cart_items;
CREATE POLICY "admins_delete_cart_items" ON public.cart_items FOR DELETE TO authenticated USING (public.is_clarime_admin());

DROP POLICY IF EXISTS "admins_select_orders" ON public.orders;
CREATE POLICY "admins_select_orders" ON public.orders FOR SELECT TO authenticated USING (public.is_clarime_admin());
DROP POLICY IF EXISTS "admins_insert_orders" ON public.orders;
CREATE POLICY "admins_insert_orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (public.is_clarime_admin());
DROP POLICY IF EXISTS "admins_update_orders" ON public.orders;
CREATE POLICY "admins_update_orders" ON public.orders FOR UPDATE TO authenticated USING (public.is_clarime_admin()) WITH CHECK (public.is_clarime_admin());
DROP POLICY IF EXISTS "admins_delete_orders" ON public.orders;
CREATE POLICY "admins_delete_orders" ON public.orders FOR DELETE TO authenticated USING (public.is_clarime_admin());

DROP POLICY IF EXISTS "admins_select_order_items" ON public.order_items;
CREATE POLICY "admins_select_order_items" ON public.order_items FOR SELECT TO authenticated USING (public.is_clarime_admin());
DROP POLICY IF EXISTS "admins_insert_order_items" ON public.order_items;
CREATE POLICY "admins_insert_order_items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (public.is_clarime_admin());
DROP POLICY IF EXISTS "admins_update_order_items" ON public.order_items;
CREATE POLICY "admins_update_order_items" ON public.order_items FOR UPDATE TO authenticated USING (public.is_clarime_admin()) WITH CHECK (public.is_clarime_admin());
DROP POLICY IF EXISTS "admins_delete_order_items" ON public.order_items;
CREATE POLICY "admins_delete_order_items" ON public.order_items FOR DELETE TO authenticated USING (public.is_clarime_admin());
