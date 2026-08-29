CREATE TABLE public.zfisales_detail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_key text NOT NULL,
  plant text,
  gl text,
  gl_name text,
  profit_ctr text,
  profit_ctr_name text,
  grp text,
  sales_type text,
  company_code text,
  company_name text,
  customer text,
  customer_name text,
  fiscal_year text,
  doc_no text,
  doc_date date,
  posting_date date,
  month text,
  reference text,
  doc_type text,
  pk text,
  amount numeric(18,2) NOT NULL DEFAULT 0,
  segment text,
  sales_order text,
  sales_order_item text,
  material text,
  material_desc text,
  raw jsonb,
  source_endpoint text,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX zfisales_detail_record_key_idx ON public.zfisales_detail (record_key);
CREATE INDEX zfisales_detail_posting_date_idx ON public.zfisales_detail (posting_date);
CREATE INDEX zfisales_detail_fiscal_year_idx ON public.zfisales_detail (fiscal_year);
CREATE INDEX zfisales_detail_company_code_idx ON public.zfisales_detail (company_code);
CREATE INDEX zfisales_detail_profit_ctr_idx ON public.zfisales_detail (profit_ctr);

GRANT SELECT ON public.zfisales_detail TO authenticated;
GRANT ALL ON public.zfisales_detail TO service_role;

ALTER TABLE public.zfisales_detail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zfisales_detail_read_authenticated"
  ON public.zfisales_detail FOR SELECT TO authenticated USING (true);

CREATE TRIGGER update_zfisales_detail_updated_at
  BEFORE UPDATE ON public.zfisales_detail
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.sap_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL,
  status text NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  records_received integer NOT NULL DEFAULT 0,
  records_inserted integer NOT NULL DEFAULT 0,
  records_updated integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sap_sync_runs_endpoint_started_idx ON public.sap_sync_runs (endpoint, started_at DESC);

GRANT SELECT ON public.sap_sync_runs TO authenticated;
GRANT ALL ON public.sap_sync_runs TO service_role;

ALTER TABLE public.sap_sync_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sap_sync_runs_read_authenticated"
  ON public.sap_sync_runs FOR SELECT TO authenticated USING (true);

CREATE TRIGGER update_sap_sync_runs_updated_at
  BEFORE UPDATE ON public.sap_sync_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();