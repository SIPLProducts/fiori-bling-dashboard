ALTER TABLE public.zfisales_detail
  ADD COLUMN IF NOT EXISTS quantity numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit text,
  ADD COLUMN IF NOT EXISTS division text,
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS sales_office text,
  ADD COLUMN IF NOT EXISTS branch text,
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS country_name text,
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS product_type text,
  ADD COLUMN IF NOT EXISTS product_range text,
  ADD COLUMN IF NOT EXISTS product_group text,
  ADD COLUMN IF NOT EXISTS main_group text,
  ADD COLUMN IF NOT EXISTS customer_group text,
  ADD COLUMN IF NOT EXISTS usage_desc text,
  ADD COLUMN IF NOT EXISTS sales_org text,
  ADD COLUMN IF NOT EXISTS incoterms text,
  ADD COLUMN IF NOT EXISTS sales_rep text,
  ADD COLUMN IF NOT EXISTS sales_rep_name text,
  ADD COLUMN IF NOT EXISTS total_ah numeric NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS zfisales_detail_country_idx ON public.zfisales_detail (country_name);
CREATE INDEX IF NOT EXISTS zfisales_detail_product_group_idx ON public.zfisales_detail (product_group);