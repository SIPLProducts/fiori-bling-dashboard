CREATE TABLE IF NOT EXISTS public.purchase_register (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  belnr text NOT NULL DEFAULT '',
  buzei text NOT NULL DEFAULT '',
  mblnr text NOT NULL DEFAULT '',
  zeile text NOT NULL DEFAULT '',
  werks text, name1_wer text, prctr text, ptext text, lifnr text, name1 text,
  budat date, mtbez text, matnr text, maktx text,
  menge_i numeric, meins_i text, mwskz text, text1_m text, bwart text, aedat date,
  meins_g text, menge_g numeric, wrbtr numeric, waers text, kursf numeric,
  dis numeric, oth numeric, plan_del numeric, tax numeric, sgst numeric, cgst numeric, igst numeric,
  no_cr numeric, gl_acc numeric, total numeric, net_amt numeric, gross_price numeric, net_price numeric,
  shkzg text, ty_purch text, ty_mat text, create_dt date,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_endpoint text,
  synced_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT purchase_register_line_key UNIQUE (belnr, buzei, mblnr, zeile)
);
CREATE INDEX IF NOT EXISTS purchase_register_budat_idx ON public.purchase_register (budat);
GRANT SELECT ON public.purchase_register TO authenticated;
GRANT ALL ON public.purchase_register TO service_role;
ALTER TABLE public.purchase_register ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Purchase register visible by access" ON public.purchase_register;
CREATE POLICY "Purchase register visible by access" ON public.purchase_register FOR SELECT TO authenticated USING (public.user_can_see(werks, prctr));
INSERT INTO public.sap_endpoints (name, module_key, description, endpoint_path, system_key, http_method, auth_type, query_params, headers, body_template, scheduler_enabled, schedule_expression, is_active, posting_range)
SELECT 'Purchase Register', 'common', 'Purchase Register (ZPUREGST) — stored in public.purchase_register', '/zpurereg/list?sap-client=234',
  (SELECT system_key FROM public.sap_endpoints WHERE system_key IS NOT NULL LIMIT 1),
  'POST', 'proxy', '[]'::jsonb, '[]'::jsonb,
  E'{\n  "BUDAT_F": "20260401",\n  "BUDAT_T": "20261027"\n}',
  false, 'IST:05:30', true, 'custom'
WHERE NOT EXISTS (SELECT 1 FROM public.sap_endpoints WHERE regexp_replace(lower(name), '[^a-z0-9]', '', 'g') LIKE '%purchaseregister%');

NOTIFY pgrst, 'reload schema';
