ALTER TABLE public.tiles
  ADD COLUMN IF NOT EXISTS screen_key text;

CREATE INDEX IF NOT EXISTS tiles_screen_key_idx
  ON public.tiles (screen_key)
  WHERE screen_key IS NOT NULL;

INSERT INTO public.role_screens (role_key, screen_key)
SELECT DISTINCT rs.role_key, child.screen_key
FROM public.role_screens rs
JOIN (
  VALUES
    ('module.sd', 'sd.total-sales'),
    ('module.sd', 'sd.open-sales-orders'),
    ('module.fi', 'fi.open-receivables'),
    ('module.fi', 'fi.open-payables'),
    ('module.fi', 'fi.days-sales-outstanding'),
    ('module.fi', 'fi.cash-flow-trend'),
    ('module.pp', 'pp.open-production-orders'),
    ('module.pp', 'pp.schedule-adherence'),
    ('module.pp', 'pp.capacity-utilisation'),
    ('module.pp', 'pp.output-trend'),
    ('group.tables-master', 'tables.zfisales-detail')
) AS child(parent_key, screen_key)
  ON child.parent_key = rs.screen_key
ON CONFLICT DO NOTHING;

UPDATE public.tiles
SET screen_key = CASE
  WHEN group_key = 'sales-distribution' AND kpi_key IS NULL AND target_path = '/reports/module/sd'
    THEN 'sd.total-sales'
  WHEN kpi_key = 'sd_open_orders' THEN 'sd.open-sales-orders'
  WHEN kpi_key = 'fi_receivables' THEN 'fi.open-receivables'
  WHEN kpi_key = 'fi_payables' THEN 'fi.open-payables'
  WHEN kpi_key = 'fi_dso' THEN 'fi.days-sales-outstanding'
  WHEN kpi_key = 'fi_cash_trend' THEN 'fi.cash-flow-trend'
  WHEN kpi_key = 'pp_open_orders' THEN 'pp.open-production-orders'
  WHEN kpi_key = 'pp_schedule_adherence' THEN 'pp.schedule-adherence'
  WHEN kpi_key = 'pp_capacity_load' THEN 'pp.capacity-utilisation'
  WHEN kpi_key = 'pp_output_trend' THEN 'pp.output-trend'
  WHEN group_key = 'tables-master' AND target_path = '/tables/zfisales-detail'
    THEN 'tables.zfisales-detail'
  ELSE screen_key
END
WHERE group_key IN (
  'sales-distribution',
  'financial-accounting',
  'production-planning',
  'tables-master'
);

DELETE FROM public.role_screens
WHERE screen_key IN ('module.sd', 'module.fi', 'module.pp', 'group.tables-master');