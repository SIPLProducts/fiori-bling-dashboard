ALTER TABLE public.sap_masters ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'sap_master';
ALTER TABLE public.sap_masters DROP CONSTRAINT IF EXISTS sap_masters_name_key;
ALTER TABLE public.sap_masters ADD CONSTRAINT sap_masters_category_name_key UNIQUE (category, name);

DROP POLICY IF EXISTS sap_masters_read ON public.sap_masters;
CREATE POLICY sap_masters_read ON public.sap_masters FOR SELECT TO authenticated
USING (public.is_data_admin(auth.uid())
  OR (category = 'sap_master' AND public.has_screen(auth.uid(), 'tables.sap-master'))
  OR (category = 'zrmmat' AND public.has_screen(auth.uid(), 'tables.zrmmat')));

DROP POLICY IF EXISTS sap_master_rows_read ON public.sap_master_rows;
CREATE POLICY sap_master_rows_read ON public.sap_master_rows FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.sap_masters m WHERE m.id = master_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sap_masters TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sap_master_rows TO authenticated;

INSERT INTO public.tiles (group_key, title, subtitle, icon, kind, kpi_key, target_path, allowed_roles, sort_order, screen_key)
SELECT 'tables-master', 'ZRMMAT', 'Raw material master', 'list', 'launch', 'table_zrmmat', '/reports/tables/zrmmat', ARRAY['admin','buyer','approver','viewer']::public.app_role[], 20, 'tables.zrmmat'
WHERE NOT EXISTS (SELECT 1 FROM public.tiles WHERE screen_key = 'tables.zrmmat');