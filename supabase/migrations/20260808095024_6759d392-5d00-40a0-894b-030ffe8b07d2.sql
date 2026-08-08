DELETE FROM public.tiles WHERE kpi_key IN ('zfi_sales_revenue','zfi_sales_trend') OR target_path = '/reports/sales-analytics';

INSERT INTO public.tiles (group_key, title, subtitle, icon, kind, kpi_key, target_path, allowed_roles, sort_order) VALUES
('sales-distribution', 'Billed Revenue', 'ZFISALES register', 'currency', 'kpi', 'zfi_sales_revenue', '/reports/sales-analytics', ARRAY['admin','buyer','viewer']::public.app_role[], -3),
('sales-distribution', 'Billing Documents by Month', 'Posting month trend', 'trend', 'chart', 'zfi_sales_trend', '/reports/sales-analytics', ARRAY['admin','buyer','viewer']::public.app_role[], -2),
('sales-distribution', 'Sales Analytics (ZFISALES)', 'Profit centre, segment & customer analysis', 'pie', 'launch', NULL, '/reports/sales-analytics', ARRAY['admin','buyer','viewer']::public.app_role[], -1);