/*
# Lock Clarimê admin access

1. Security corrections
- Remove anonymous Data API privileges from all Clarimê management tables.
- Keep authenticated administrator policies as the only route to store data.
- Make the auth trigger helper callable only by the database trigger owner.

2. Why this matters
- Store customers and visitors must not be able to read carts, sales, profiles, or internal catalog management data.
- The helper that creates profiles is an internal trigger implementation, not a public RPC.
*/

REVOKE ALL ON TABLE public.profiles, public.products, public.carts, public.cart_items, public.orders, public.order_items FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_clarime_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_clarime_admin() TO authenticated;
