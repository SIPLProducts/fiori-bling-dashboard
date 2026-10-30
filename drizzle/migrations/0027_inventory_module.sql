INSERT INTO public.tile_groups (key, title, sort_order)
SELECT 'inventory', 'Inventory', 24
WHERE NOT EXISTS (SELECT 1 FROM public.tile_groups WHERE key = 'inventory');
INSERT INTO public.tiles (group_key, title, subtitle, icon, kind, kpi_key, target_path, allowed_roles, sort_order, screen_key)
SELECT 'inventory', v.title, v.subtitle, 'list', 'launch', v.kpi, v.path, ARRAY['admin','buyer','approver','viewer']::public.app_role[], v.ord, v.screen
FROM (VALUES
  ('Current Stock','Stock on hand','inv_current_stock','/reports/inv/current-stock',1,'inv.current-stock'),
  ('Month Wise Stock','Monthly stock levels','inv_month_wise_stock','/reports/inv/month-wise-stock',2,'inv.month-wise-stock'),
  ('Inventory Aging','Stock by age bucket','inv_inventory_aging','/reports/inv/inventory-aging',3,'inv.inventory-aging')
) AS v(title, subtitle, kpi, path, ord, screen)
WHERE NOT EXISTS (SELECT 1 FROM public.tiles t WHERE t.screen_key = v.screen);
INSERT INTO public.role_screens (role_key, screen_key)
SELECT r.key, s.k FROM public.roles r
CROSS JOIN (VALUES ('module.inv'),('inv.current-stock'),('inv.month-wise-stock'),('inv.inventory-aging')) AS s(k)
WHERE r.key IN ('admin','super_admin')
ON CONFLICT DO NOTHING;