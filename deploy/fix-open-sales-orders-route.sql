-- Run against each self-hosted environment after deploying the dedicated
-- Open Sales Orders dashboard route.
UPDATE public.tiles
SET target_path = '/reports/sd/open-sales-orders'
WHERE group_key = 'sales-distribution'
  AND kpi_key = 'sd_open_orders';

NOTIFY pgrst, 'reload schema';