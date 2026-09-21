-- Remove retired Sales & Distribution launchpad cards.
-- Safe to run in both Quality and Production.
DELETE FROM public.tiles
WHERE kpi_key IN (
  'zfi_sales_revenue',
  'sd_net_sales',
  'sd_backorders',
  'sd_sales_trend'
);