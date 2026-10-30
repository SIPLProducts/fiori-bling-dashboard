CREATE TABLE public.sap_masters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  columns text[] NOT NULL DEFAULT '{}',
  key_column text NOT NULL,
  row_count integer NOT NULL DEFAULT 0,
  last_uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.sap_master_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id uuid NOT NULL REFERENCES public.sap_masters(id) ON DELETE CASCADE,
  key_value text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (master_id, key_value)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sap_masters TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sap_master_rows TO authenticated;
GRANT ALL ON public.sap_masters TO service_role;
GRANT ALL ON public.sap_master_rows TO service_role;
ALTER TABLE public.sap_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sap_master_rows ENABLE ROW LEVEL SECURITY;
CREATE POLICY sap_masters_read ON public.sap_masters FOR SELECT TO authenticated USING (public.has_screen(auth.uid(), 'tables.sap-master') OR public.is_data_admin(auth.uid()));
CREATE POLICY sap_masters_write ON public.sap_masters FOR ALL TO authenticated USING (public.is_data_admin(auth.uid())) WITH CHECK (public.is_data_admin(auth.uid()));
CREATE POLICY sap_master_rows_read ON public.sap_master_rows FOR SELECT TO authenticated USING (public.has_screen(auth.uid(), 'tables.sap-master') OR public.is_data_admin(auth.uid()));
CREATE POLICY sap_master_rows_write ON public.sap_master_rows FOR ALL TO authenticated USING (public.is_data_admin(auth.uid())) WITH CHECK (public.is_data_admin(auth.uid()));

-- Merge upload: add new rows, update matching rows (existing cells kept when absent), append new columns.
CREATE OR REPLACE FUNCTION public.upsert_sap_master_rows(_master_id uuid, _columns text[], _rows jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF NOT public.is_data_admin(auth.uid()) THEN RAISE EXCEPTION 'Only admins can upload masters'; END IF;
  INSERT INTO public.sap_master_rows (master_id, key_value, data)
  SELECT _master_id, r->>'k', r->'d' FROM jsonb_array_elements(_rows) r
  WHERE coalesce(r->>'k','') <> ''
  ON CONFLICT (master_id, key_value) DO UPDATE
    SET data = public.sap_master_rows.data || EXCLUDED.data, updated_at = now();
  GET DIAGNOSTICS n = ROW_COUNT;
  UPDATE public.sap_masters m SET
    columns = m.columns || ARRAY(SELECT c FROM unnest(_columns) c WHERE NOT c = ANY(m.columns)),
    row_count = (SELECT count(*) FROM public.sap_master_rows WHERE master_id = _master_id),
    last_uploaded_at = now()
  WHERE m.id = _master_id;
  RETURN n;
END $$;
GRANT EXECUTE ON FUNCTION public.upsert_sap_master_rows(uuid, text[], jsonb) TO authenticated;

INSERT INTO public.tiles (group_key, title, subtitle, icon, kind, kpi_key, target_path, allowed_roles, sort_order, screen_key)
SELECT 'tables-master', 'SAP MASTER', 'Excel master lists', 'list', 'launch', 'table_sap_master', '/reports/tables/sap-master', ARRAY['admin','buyer','approver','viewer']::public.app_role[], 10, 'tables.sap-master'
WHERE NOT EXISTS (SELECT 1 FROM public.tiles WHERE screen_key = 'tables.sap-master');
INSERT INTO public.role_screens (role_key, screen_key)
SELECT r.key, 'tables.sap-master' FROM public.roles r WHERE r.key IN ('admin','super_admin')
ON CONFLICT DO NOTHING;