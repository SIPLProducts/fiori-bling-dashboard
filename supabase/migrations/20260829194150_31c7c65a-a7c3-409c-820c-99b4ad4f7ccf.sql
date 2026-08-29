CREATE TABLE public.sap_table_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_key text NOT NULL,
  field_name text NOT NULL,
  ui_label text NOT NULL,
  sap_field text NOT NULL,
  data_type text NOT NULL DEFAULT 'text',
  is_key boolean NOT NULL DEFAULT false,
  is_required boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (table_key, field_name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sap_table_fields TO authenticated;
GRANT ALL ON public.sap_table_fields TO service_role;

ALTER TABLE public.sap_table_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY sap_table_fields_read ON public.sap_table_fields
  FOR SELECT TO authenticated USING (true);

CREATE POLICY sap_table_fields_super_admin_write ON public.sap_table_fields
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER update_sap_table_fields_updated_at
  BEFORE UPDATE ON public.sap_table_fields
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
