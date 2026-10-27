INSERT INTO public.tile_groups (key, title, sort_order)
SELECT 'purchase', 'Purchase', 20
WHERE NOT EXISTS (SELECT 1 FROM public.tile_groups WHERE key = 'purchase');

INSERT INTO public.tiles (group_key, title, subtitle, icon, kind, kpi_key, target_path, allowed_roles, sort_order, screen_key)
SELECT v.g, v.t, v.s, v.i, 'launch', v.k, v.p, ARRAY['admin','buyer','approver','viewer']::public.app_role[], v.o, v.sk
FROM (VALUES
  ('purchase', 'Purchase Register', 'Purchase register reporting', 'doc', 'mm_purchase_register', '/reports/mm/purchase-register', 1, 'mm.purchase-register'),
  ('purchase', 'Purchase Orders', 'Purchase order reporting', 'cart', 'mm_purchase_orders', '/reports/mm/purchase-orders', 2, 'mm.purchase-orders'),
  ('purchase', 'Open Purchase Orders', 'Open purchase order reporting', 'list', 'mm_open_purchase_orders', '/reports/mm/open-purchase-orders', 3, 'mm.open-purchase-orders')
) AS v(g, t, s, i, k, p, o, sk)
WHERE NOT EXISTS (SELECT 1 FROM public.tiles WHERE screen_key = v.sk);

INSERT INTO public.role_screens (role_key, screen_key)
SELECT r.key, s.k
FROM public.roles r
CROSS JOIN (VALUES ('mm.purchase-register'), ('mm.purchase-orders'), ('mm.open-purchase-orders')) AS s(k)
WHERE r.key IN ('admin', 'super_admin')
ON CONFLICT DO NOTHING;

-- Module-level permission for the Purchase section (safe to rerun).
INSERT INTO public.role_screens (role_key, screen_key)
SELECT r.key, 'module.mm' FROM public.roles r
WHERE r.key IN ('admin', 'super_admin')
ON CONFLICT DO NOTHING;
