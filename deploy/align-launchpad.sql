-- Idempotent launchpad cleanup for self-hosted Quality and Production.
-- Safe to run repeatedly after application migrations.
DELETE FROM public.tile_groups
WHERE key IN (
  'procurement-overview',
  'purchase-order',
  'purchase-requisition',
  'supplier-evaluation',
  'purchase-contract',
  'workflow',
  'controlling',
  'quality-management',
  'project-systems'
);

DELETE FROM public.role_screens
WHERE screen_key IN (
  'group.procurement-overview',
  'group.purchase-order',
  'group.purchase-requisition',
  'group.supplier-evaluation',
  'group.purchase-contract',
  'group.workflow',
  'reports.procurement',
  'reports.purchase-orders',
  'reports.suppliers',
  'module.co',
  'module.qm',
  'module.ps'
);

DELETE FROM public.tiles
WHERE kpi_key IN (
  'zfi_sales_revenue',
  'zfi_sales_trend',
  'sd_net_sales',
  'sd_backorders',
  'sd_sales_trend'
)
OR (
  group_key = 'sales-distribution'
  AND target_path = '/reports/sales-analytics'
);

UPDATE public.tiles
SET target_path = '/reports/sd/open-sales-orders'
WHERE group_key = 'sales-distribution'
  AND kpi_key = 'sd_open_orders';

UPDATE public.tiles
SET title = 'Net Sales', subtitle = 'Live sales dashboard', sort_order = 1, screen_key = 'sd.total-sales'
WHERE group_key = 'sales-distribution'
  AND target_path = '/reports/module/sd';

UPDATE public.tiles
SET title = 'Open Sales Orders', sort_order = 4, screen_key = 'sd.open-sales-orders'
WHERE group_key = 'sales-distribution'
  AND kpi_key = 'sd_open_orders';

UPDATE public.tiles
SET title = 'TBN', sort_order = 1, screen_key = 'fi.tbn'
WHERE group_key = 'financial-accounting'
  AND screen_key = 'fi.tbn';

INSERT INTO public.tiles (group_key, title, subtitle, icon, kind, kpi_key, target_path, allowed_roles, sort_order, screen_key)
SELECT 'sales-distribution', 'Dispatches', 'Dispatch reporting', 'shipping', 'launch', 'sd_dispatches', '/reports/sd/dispatches', ARRAY['admin','buyer','approver','viewer']::public.app_role[], 2, 'sd.dispatches'
WHERE NOT EXISTS (SELECT 1 FROM public.tiles WHERE screen_key = 'sd.dispatches');

INSERT INTO public.tiles (group_key, title, subtitle, icon, kind, kpi_key, target_path, allowed_roles, sort_order, screen_key)
SELECT 'sales-distribution', 'Order Book', 'Order book reporting', 'list', 'launch', 'sd_order_book', '/reports/sd/order-book', ARRAY['admin','buyer','approver','viewer']::public.app_role[], 3, 'sd.order-book'
WHERE NOT EXISTS (SELECT 1 FROM public.tiles WHERE screen_key = 'sd.order-book');

INSERT INTO public.tiles (group_key, title, subtitle, icon, kind, kpi_key, target_path, allowed_roles, sort_order, screen_key)
SELECT 'financial-accounting', 'Cash Flow', 'Cash flow reporting', 'trend', 'launch', 'fi_cash_flow', '/reports/fi/cash-flow', ARRAY['admin','buyer','approver','viewer']::public.app_role[], 2, 'fi.cash-flow'
WHERE NOT EXISTS (SELECT 1 FROM public.tiles WHERE screen_key = 'fi.cash-flow');

INSERT INTO public.tiles (group_key, title, subtitle, icon, kind, kpi_key, target_path, allowed_roles, sort_order, screen_key)
SELECT 'financial-accounting', 'Asset Register', 'Asset register reporting', 'table', 'launch', 'fi_asset_register', '/reports/fi/asset-register', ARRAY['admin','buyer','approver','viewer']::public.app_role[], 3, 'fi.asset-register'
WHERE NOT EXISTS (SELECT 1 FROM public.tiles WHERE screen_key = 'fi.asset-register');

INSERT INTO public.role_screens (role_key, screen_key)
SELECT DISTINCT rs.role_key, child.screen_key
FROM public.role_screens rs
CROSS JOIN (VALUES ('sd.dispatches'), ('sd.order-book')) AS child(screen_key)
WHERE rs.screen_key IN ('sd.total-sales', 'sd.open-sales-orders')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_screens (role_key, screen_key)
SELECT DISTINCT rs.role_key, child.screen_key
FROM public.role_screens rs
CROSS JOIN (VALUES ('fi.cash-flow'), ('fi.asset-register')) AS child(screen_key)
WHERE rs.screen_key IN ('fi.tbn', 'fi.open-receivables', 'fi.open-payables', 'fi.days-sales-outstanding', 'fi.cash-flow-trend')
ON CONFLICT DO NOTHING;

DELETE FROM public.tiles
WHERE group_key = 'financial-accounting'
  AND screen_key IN ('fi.open-receivables', 'fi.open-payables', 'fi.days-sales-outstanding', 'fi.cash-flow-trend');

DELETE FROM public.role_screens
WHERE screen_key IN ('fi.open-receivables', 'fi.open-payables', 'fi.days-sales-outstanding', 'fi.cash-flow-trend');

NOTIFY pgrst, 'reload schema';
