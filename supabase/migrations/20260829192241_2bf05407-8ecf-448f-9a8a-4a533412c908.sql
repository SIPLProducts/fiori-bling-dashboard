CREATE TABLE public.sap_table_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_key text NOT NULL UNIQUE,
  table_name text NOT NULL,
  display_name text NOT NULL,
  description text,
  endpoint_id uuid REFERENCES public.sap_endpoints(id) ON DELETE SET NULL,
  api_name text,
  schedule_expression text NOT NULL DEFAULT '*/5 * * * *',
  sync_enabled boolean NOT NULL DEFAULT true,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  last_synced_at timestamptz,
  last_sync_status text,
  last_sync_records integer NOT NULL DEFAULT 0,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sap_table_mappings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.sap_table_mappings TO authenticated;
GRANT ALL ON public.sap_table_mappings TO service_role;

ALTER TABLE public.sap_table_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "table_mappings_read" ON public.sap_table_mappings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "table_mappings_super_admin_write" ON public.sap_table_mappings
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER update_sap_table_mappings_updated_at
  BEFORE UPDATE ON public.sap_table_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.sap_table_mappings (table_key, table_name, display_name, description, api_name, schedule_expression)
VALUES ('zfisales-detail', 'zfisales_detail', 'ZFISALES_DETAIL', 'SAP FI/SD sales register detail lines synced from SAP.', 'Sales_Reports_KPI', '*/5 * * * *');