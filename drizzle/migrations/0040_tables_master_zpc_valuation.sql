ALTER TABLE public.sap_masters ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
UPDATE public.sap_masters SET updated_at = coalesce(last_uploaded_at, created_at, now());

DROP POLICY IF EXISTS sap_masters_read ON public.sap_masters;
CREATE POLICY sap_masters_read ON public.sap_masters FOR SELECT TO authenticated
USING (public.is_data_admin(auth.uid()) OR public.has_screen(auth.uid(), 'tables.' || replace(category, '_', '-')));
DROP POLICY IF EXISTS sap_masters_write ON public.sap_masters;
CREATE POLICY sap_masters_write ON public.sap_masters FOR ALL TO authenticated
  USING (public.is_data_admin(auth.uid()) OR public.has_screen(auth.uid(), 'tables.' || replace(category, '_', '-')))
  WITH CHECK (public.is_data_admin(auth.uid()) OR public.has_screen(auth.uid(), 'tables.' || replace(category, '_', '-')));
DROP POLICY IF EXISTS sap_master_rows_write ON public.sap_master_rows;
CREATE POLICY sap_master_rows_write ON public.sap_master_rows FOR ALL TO authenticated
  USING (public.is_data_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.sap_masters m WHERE m.id = sap_master_rows.master_id AND public.has_screen(auth.uid(), 'tables.' || replace(m.category, '_', '-'))))
  WITH CHECK (public.is_data_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.sap_masters m WHERE m.id = sap_master_rows.master_id AND public.has_screen(auth.uid(), 'tables.' || replace(m.category, '_', '-'))));

CREATE OR REPLACE FUNCTION public.upsert_sap_master_rows(_master_id uuid, _columns text[], _rows jsonb)
 RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path TO 'public'
AS $function$
DECLARE n integer; has_access boolean;
BEGIN
  SELECT (public.is_data_admin(auth.uid()) OR public.has_screen(auth.uid(), 'tables.' || replace(m.category, '_', '-')))
    INTO has_access FROM public.sap_masters m WHERE m.id = _master_id;
  IF NOT coalesce(has_access, false) THEN RAISE EXCEPTION 'Access denied: You do not have permission to upload rows to this master'; END IF;
  INSERT INTO public.sap_master_rows (master_id, key_value, data)
  SELECT _master_id, r->>'k', r->'d' FROM jsonb_array_elements(_rows) r WHERE coalesce(r->>'k','') <> ''
  ON CONFLICT (master_id, key_value) DO UPDATE SET data = public.sap_master_rows.data || EXCLUDED.data, updated_at = now();
  GET DIAGNOSTICS n = ROW_COUNT;
  UPDATE public.sap_masters m SET columns = m.columns || ARRAY(SELECT c FROM unnest(_columns) c WHERE NOT c = ANY(m.columns)),
    row_count = (SELECT count(*) FROM public.sap_master_rows WHERE master_id = _master_id), last_uploaded_at = now(), updated_at = now()
  WHERE m.id = _master_id;
  RETURN n;
END $function$;

INSERT INTO public.tiles (group_key, title, subtitle, icon, kind, kpi_key, target_path, allowed_roles, sort_order, screen_key)
SELECT 'tables-master', 'ZPC GROUP', 'Profit center group master', 'list', 'launch', 'table_zpc_group', '/reports/tables/zpc-group', ARRAY['admin','buyer','approver','viewer']::public.app_role[], 30, 'tables.zpc-group'
WHERE NOT EXISTS (SELECT 1 FROM public.tiles WHERE screen_key = 'tables.zpc-group');
INSERT INTO public.tiles (group_key, title, subtitle, icon, kind, kpi_key, target_path, allowed_roles, sort_order, screen_key)
SELECT 'tables-master', 'Valuation Class Wise Subgroup', 'Valuation class subgroup master', 'list', 'launch', 'table_valuation_subgroup', '/reports/tables/valuation-subgroup', ARRAY['admin','buyer','approver','viewer']::public.app_role[], 40, 'tables.valuation-subgroup'
WHERE NOT EXISTS (SELECT 1 FROM public.tiles WHERE screen_key = 'tables.valuation-subgroup');