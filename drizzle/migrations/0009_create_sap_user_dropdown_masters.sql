CREATE TABLE IF NOT EXISTS public.sap_user_dropdown_masters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('plant','profit_center')),
  code text NOT NULL,
  name text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_endpoint text NOT NULL DEFAULT 'Get_User_Management_Dropdown_RES',
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sap_user_dropdown_masters_unique_key UNIQUE (category, code)
);
GRANT SELECT ON public.sap_user_dropdown_masters TO authenticated;
GRANT ALL ON public.sap_user_dropdown_masters TO service_role;
ALTER TABLE public.sap_user_dropdown_masters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sap_user_dropdown_masters_read ON public.sap_user_dropdown_masters;
CREATE POLICY sap_user_dropdown_masters_read ON public.sap_user_dropdown_masters FOR SELECT TO authenticated USING (true);
DROP TRIGGER IF EXISTS update_sap_user_dropdown_masters_updated_at ON public.sap_user_dropdown_masters;
CREATE TRIGGER update_sap_user_dropdown_masters_updated_at BEFORE UPDATE ON public.sap_user_dropdown_masters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
NOTIFY pgrst, 'reload schema';