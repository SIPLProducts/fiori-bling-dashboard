-- User Management dropdowns install for Quality / Production (safe to re-run).
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

-- Register the SAP API (daily 05:30 IST), using the same SAP system as Open Sales Orders.
INSERT INTO public.sap_endpoints
  (name, module_key, description, endpoint_path, system_key, http_method, auth_type,
   query_params, headers, scheduler_enabled, schedule_expression, posting_range, is_active)
SELECT 'Get_User_Management_Dropdown_RES', 'common',
  'Plants and profit centers for User Management dropdowns. Stored in sap_user_dropdown_masters (insert or update by category + code).',
  '/zsd_open/open?sap-client=234',
  (SELECT system_key FROM public.sap_endpoints WHERE name = 'Open _Sales _Orders' LIMIT 1),
  'GET', 'proxy', '[]'::jsonb, '[]'::jsonb, true, 'IST:05:30', 'custom', true
WHERE NOT EXISTS (SELECT 1 FROM public.sap_endpoints WHERE name = 'Get_User_Management_Dropdown_RES');

NOTIFY pgrst, 'reload schema';

-- Check after a sync:
-- SELECT category, count(*) FROM public.sap_user_dropdown_masters GROUP BY category;
