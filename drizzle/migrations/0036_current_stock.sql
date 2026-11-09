-- Current Stock (MIS Inventory API, GET /zdpr_mis/report). Full current snapshot per Material + Plant + SLoc + Batch.
CREATE TABLE IF NOT EXISTS public.current_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matnr text NOT NULL,
  werks text NOT NULL DEFAULT '',
  lgort text NOT NULL DEFAULT '',
  charg text NOT NULL DEFAULT '',
  lgobe text, maktx text, meins text, mtart text,
  labst numeric, wlabs numeric, insme numeric, winsm numeric,
  speme numeric, wspem numeric, trame numeric, wtram numeric,
  rowno text, shelfno text, rackno text, binno text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_endpoint text,
  synced_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT current_stock_line_key UNIQUE (matnr, werks, lgort, charg)
);
CREATE INDEX IF NOT EXISTS current_stock_werks_idx ON public.current_stock (werks);
CREATE INDEX IF NOT EXISTS current_stock_synced_idx ON public.current_stock (synced_at);
GRANT SELECT ON public.current_stock TO authenticated;
GRANT ALL ON public.current_stock TO service_role;
ALTER TABLE public.current_stock ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Current stock visible by access" ON public.current_stock;
CREATE POLICY "Current stock visible by access" ON public.current_stock FOR SELECT TO authenticated USING (
  (SELECT public.has_screen(auth.uid(), 'inv.current-stock')) AND ((SELECT public.current_access_unrestricted()) OR COALESCE(werks,'') = ANY ((SELECT public.current_access_plants())::text[])));
INSERT INTO public.sap_endpoints (name, module_key, description, endpoint_path, system_key, http_method, auth_type, body_template, posting_range, is_active)
SELECT 'Current_Stock','common','MIS Inventory current stock (MARD/MCHB)','/zdpr_mis/report?sap-client=234','dev','GET','proxy','{}','custom',true
WHERE NOT EXISTS (SELECT 1 FROM public.sap_endpoints WHERE name='Current_Stock');
NOTIFY pgrst, 'reload schema';
