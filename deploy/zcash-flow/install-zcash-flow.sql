-- ZCASH_FLOW install for Quality / Production (run in the SQL editor).
-- Safe to re-run. Creates the table and registers the SAP API.

CREATE TABLE IF NOT EXISTS public.zcash_flow (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profit_center text NOT NULL DEFAULT '',
  plant text NOT NULL DEFAULT '',
  gl_code text NOT NULL DEFAULT '',
  profit_center_name text,
  group_name text,
  gl_name text,
  classification text,
  nature text,
  profit_center_group text,
  debit numeric NOT NULL DEFAULT 0,
  credit numeric NOT NULL DEFAULT 0,
  net numeric NOT NULL DEFAULT 0,
  collection_disbursement text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_endpoint text NOT NULL DEFAULT 'ZCASH_FLOW',
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT zcash_flow_unique_key UNIQUE (profit_center, plant, gl_code)
);
GRANT SELECT ON public.zcash_flow TO authenticated;
GRANT ALL ON public.zcash_flow TO service_role;
ALTER TABLE public.zcash_flow ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS zcash_flow_authorized_read ON public.zcash_flow;
CREATE POLICY zcash_flow_authorized_read ON public.zcash_flow FOR SELECT TO authenticated
  USING (public.has_screen(auth.uid(), 'fi.cash-flow'));
CREATE INDEX IF NOT EXISTS zcash_flow_plant_idx ON public.zcash_flow (plant);
CREATE INDEX IF NOT EXISTS zcash_flow_gl_code_idx ON public.zcash_flow (gl_code);
DROP TRIGGER IF EXISTS update_zcash_flow_updated_at ON public.zcash_flow;
CREATE TRIGGER update_zcash_flow_updated_at BEFORE UPDATE ON public.zcash_flow
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Register the API (same daily schedule as the other APIs: 5:30 am and 1:00 pm IST).
-- Uses the same SAP system as the existing Open Sales Orders API.
INSERT INTO public.sap_endpoints
  (name, module_key, description, endpoint_path, system_key, http_method, auth_type,
   query_params, headers, body_template, scheduler_enabled, schedule_expression, posting_range, is_active)
SELECT 'ZCASH_FLOW', 'common', 'ZCASHFLOWN - List of Cash Flow. Stored in zcash_flow (insert or update by Profit Center + Plant + GL Code).',
  '/zcashflown/cashflown?sap-client=234',
  (SELECT system_key FROM public.sap_endpoints WHERE name = 'Open _Sales _Orders' LIMIT 1),
  'POST', 'proxy', '[]'::jsonb, '[]'::jsonb,
'{
  "company_code": "1000",
  "fiscal_year": "2026",
  "profit_center": [
    { "profit_center": "COFF100001" },
    { "profit_center": "COFF100004" }
  ],
  "plant": [
    { "plant": "1000" },
    { "plant": "1100" }
  ],
  "posting_date": {
    "from_date": "20250101",
    "to_date": "20261008"
  }
}', true, 'IST:05:30,13:00', 'custom', true
WHERE NOT EXISTS (SELECT 1 FROM public.sap_endpoints WHERE name = 'ZCASH_FLOW');

NOTIFY pgrst, 'reload schema';

-- Check after a sync:
-- SELECT count(*), sum(debit), sum(credit), sum(net) FROM public.zcash_flow;
