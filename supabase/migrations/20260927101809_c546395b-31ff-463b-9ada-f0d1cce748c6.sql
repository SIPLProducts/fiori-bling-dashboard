INSERT INTO public.tiles (
  group_key,
  title,
  subtitle,
  icon,
  kind,
  kpi_key,
  target_path,
  allowed_roles,
  sort_order,
  screen_key
)
SELECT
  'financial-accounting',
  'TBN',
  'Trial balance — all ZTBN values',
  'table',
  'launch',
  'fi_tbn',
  '/reports/fi/tbn',
  ARRAY['admin','buyer','approver','viewer']::public.app_role[],
  5,
  'fi.tbn'
WHERE NOT EXISTS (
  SELECT 1 FROM public.tiles
  WHERE group_key = 'financial-accounting' AND screen_key = 'fi.tbn'
);

INSERT INTO public.role_screens (role_key, screen_key)
SELECT DISTINCT role_key, 'fi.tbn'
FROM public.role_screens
WHERE screen_key IN (
  'module.fi',
  'fi.open-receivables',
  'fi.open-payables',
  'fi.days-sales-outstanding',
  'fi.cash-flow-trend'
)
ON CONFLICT DO NOTHING;