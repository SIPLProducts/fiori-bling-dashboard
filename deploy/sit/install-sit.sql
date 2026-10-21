-- Sales In Transit (SIT): launchpad tile after Net Sales + permission inheritance. Idempotent.
UPDATE public.tiles SET sort_order = sort_order + 1
WHERE group_key = 'sales-distribution' AND screen_key IN ('sd.dispatches','sd.order-book','sd.open-sales-orders')
  AND NOT EXISTS (SELECT 1 FROM public.tiles WHERE screen_key = 'sd.sit');

INSERT INTO public.tiles (group_key, title, subtitle, icon, kind, kpi_key, target_path, allowed_roles, sort_order, screen_key)
SELECT 'sales-distribution', 'Sales In Transit (SIT)', 'Sales in transit reporting', 'shipping', 'launch', 'sd_sit', '/reports/sd/sit', ARRAY['admin','buyer','approver','viewer']::public.app_role[], 2, 'sd.sit'
WHERE NOT EXISTS (SELECT 1 FROM public.tiles WHERE screen_key = 'sd.sit');

INSERT INTO public.role_screens (role_key, screen_key)
SELECT DISTINCT role_key, 'sd.sit' FROM public.role_screens
WHERE screen_key IN ('sd.total-sales','sd.order-book','sd.open-sales-orders')
ON CONFLICT DO NOTHING;
