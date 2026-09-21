UPDATE public.tiles
SET target_path = '/reports/sd/open-sales-orders'
WHERE group_key = 'sales-distribution'
  AND kpi_key = 'sd_open_orders';