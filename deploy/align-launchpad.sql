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

NOTIFY pgrst, 'reload schema';
