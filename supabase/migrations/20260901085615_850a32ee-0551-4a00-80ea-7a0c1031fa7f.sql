ALTER TABLE public.zfisales_detail
  ADD COLUMN IF NOT EXISTS pc_short_name text,
  ADD COLUMN IF NOT EXISTS sub_group text,
  ADD COLUMN IF NOT EXISTS new_repl text,
  ADD COLUMN IF NOT EXISTS division_name text,
  ADD COLUMN IF NOT EXISTS industry_name text,
  ADD COLUMN IF NOT EXISTS doc_item text,
  ADD COLUMN IF NOT EXISTS material_profit_ctr text,
  ADD COLUMN IF NOT EXISTS material_profit_ctr_name text,
  ADD COLUMN IF NOT EXISTS ah numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sales_zone text,
  ADD COLUMN IF NOT EXISTS customer_profile text;