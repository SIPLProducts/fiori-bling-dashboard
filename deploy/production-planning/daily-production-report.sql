-- Production Planning: keep only Daily Production Report (safe to rerun).
DELETE FROM public.role_screens
WHERE screen_key IN ('pp.open-production-orders','pp.schedule-adherence','pp.capacity-utilisation','pp.output-trend');

DELETE FROM public.tiles
WHERE group_key = 'production-planning'
  AND kpi_key IN ('pp_open_orders','pp_schedule_adherence','pp_capacity_load','pp_output_trend');

INSERT INTO public.tiles (group_key, title, subtitle, icon, kind, kpi_key, target_path, allowed_roles, sort_order, screen_key)
SELECT 'production-planning', 'Daily Production Report', 'Daily production output', 'list', 'launch', 'pp_daily_production',
       '/reports/pp/daily-production-report', ARRAY['admin','buyer','approver','viewer']::public.app_role[], 1, 'pp.daily-production-report'
WHERE NOT EXISTS (SELECT 1 FROM public.tiles WHERE screen_key = 'pp.daily-production-report');

INSERT INTO public.role_screens (role_key, screen_key)
SELECT r.key, s.k FROM public.roles r
CROSS JOIN (VALUES ('pp.daily-production-report'), ('module.pp')) AS s(k)
WHERE r.key IN ('admin', 'super_admin')
ON CONFLICT DO NOTHING;
