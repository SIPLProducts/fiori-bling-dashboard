CREATE TABLE public.zfisales_import_stage (
  record_key text NOT NULL,
  gl text, gl_name text, profit_ctr text, profit_ctr_name text, pc_short_name text,
  main_group text, sub_group text, grp text, new_repl text, sales_type text,
  customer text, customer_name text, fiscal_year text, division text, division_name text,
  industry text, industry_name text, doc_no text, doc_item text, sales_office text,
  country_code text, country_name text, sales_order text, sales_order_item text,
  material text, material_desc text, material_profit_ctr text, material_profit_ctr_name text,
  unit text, model text, product_range text, product_type text, month text,
  reference text, doc_type text, pk text, segment text, sales_rep text, sales_rep_name text,
  sales_zone text, incoterms text, customer_profile text, customer_group text, usage_desc text,
  quantity numeric, ah numeric, total_ah numeric, amount numeric,
  doc_date date, posting_date date, raw jsonb, source_endpoint text
);

GRANT ALL ON public.zfisales_import_stage TO service_role;

ALTER TABLE public.zfisales_import_stage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stage_super_admin_all" ON public.zfisales_import_stage
FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));