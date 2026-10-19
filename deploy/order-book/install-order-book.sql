CREATE TABLE IF NOT EXISTS public.order_book (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order text NOT NULL,
  sales_order_item text NOT NULL,
  apptyp text,
  sector text,
  vtweg text,
  spart text,
  plant text,
  auart text,
  kunnr_sp text,
  name1_sp text,
  kunnr_bp text,
  name1_bp text,
  kunnr_sh text,
  name1_sh text,
  bstnk text,
  matnr text,
  maktx text,
  vrkme text,
  waerk text,
  zterm text,
  pay_vtext text,
  delv_dat text,
  warty text,
  inco1 text,
  ld_terms text,
  vkbur text,
  name1_se text,
  vtext_dc text,
  vtext_di text,
  inco2 text,
  meins text,
  bezei text,
  landx_sp text,
  bezei_sp text,
  landx_bp text,
  bezei_bp text,
  landx_sh text,
  bezei_sh text,
  vgbel text,
  proj text,
  vkgrp text,
  year text,
  absta text,
  gbsta text,
  buy_back text,
  buy_back_detail text,
  unload text,
  plant_name text,
  div_name text,
  profit_center text,
  pc_name text,
  main_grp text,
  sub_grp text,
  kwmeng numeric NOT NULL DEFAULT 0,
  kwmeng_p numeric NOT NULL DEFAULT 0,
  stcur numeric NOT NULL DEFAULT 0,
  kbetr numeric NOT NULL DEFAULT 0,
  kwmeng_c numeric NOT NULL DEFAULT 0,
  kwmeng_pc numeric NOT NULL DEFAULT 0,
  p_value numeric NOT NULL DEFAULT 0,
  kwert_ba numeric NOT NULL DEFAULT 0,
  kwert_bc numeric NOT NULL DEFAULT 0,
  kwert_bci numeric NOT NULL DEFAULT 0,
  kwert_ds numeric NOT NULL DEFAULT 0,
  kwert_ed numeric NOT NULL DEFAULT 0,
  kwert_cst numeric NOT NULL DEFAULT 0,
  kwert_vat numeric NOT NULL DEFAULT 0,
  kwert_st numeric NOT NULL DEFAULT 0,
  kwert_sw numeric NOT NULL DEFAULT 0,
  kwert_gst numeric NOT NULL DEFAULT 0,
  kwert_kkc numeric NOT NULL DEFAULT 0,
  kwert_vsc numeric NOT NULL DEFAULT 0,
  netwr numeric NOT NULL DEFAULT 0,
  kwert_fr numeric NOT NULL DEFAULT 0,
  znrc numeric NOT NULL DEFAULT 0,
  zcom numeric NOT NULL DEFAULT 0,
  zpf1 numeric NOT NULL DEFAULT 0,
  ztax numeric NOT NULL DEFAULT 0,
  zdst numeric NOT NULL DEFAULT 0,
  kf00 numeric NOT NULL DEFAULT 0,
  zf01 numeric NOT NULL DEFAULT 0,
  zf02 numeric NOT NULL DEFAULT 0,
  kursk numeric NOT NULL DEFAULT 0,
  tot_inr numeric NOT NULL DEFAULT 0,
  net_inr numeric NOT NULL DEFAULT 0,
  umren numeric NOT NULL DEFAULT 0,
  tot_ah numeric NOT NULL DEFAULT 0,
  basic_ah numeric NOT NULL DEFAULT 0,
  basic_ahinr numeric NOT NULL DEFAULT 0,
  umvkz numeric NOT NULL DEFAULT 0,
  twar numeric NOT NULL DEFAULT 0,
  kwert_zsbp numeric NOT NULL DEFAULT 0,
  kwert_zsf1 numeric NOT NULL DEFAULT 0,
  kwert_zsf2 numeric NOT NULL DEFAULT 0,
  created_date date,
  bstdk date,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_endpoint text NOT NULL DEFAULT '',
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_book_sales_order_item_key UNIQUE (sales_order, sales_order_item)
);

GRANT SELECT ON public.order_book TO authenticated;
GRANT ALL ON public.order_book TO service_role;

ALTER TABLE public.order_book ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Order book visible by plant or profit centre" ON public.order_book;
CREATE POLICY "Order book visible by plant or profit centre" ON public.order_book
  FOR SELECT TO authenticated
  USING (public.user_can_see(plant, profit_center));

CREATE INDEX IF NOT EXISTS order_book_created_date_idx ON public.order_book (created_date);
CREATE INDEX IF NOT EXISTS order_book_plant_idx ON public.order_book (plant);
CREATE INDEX IF NOT EXISTS order_book_profit_center_idx ON public.order_book (profit_center);

DROP TRIGGER IF EXISTS update_order_book_updated_at ON public.order_book;
CREATE TRIGGER update_order_book_updated_at BEFORE UPDATE ON public.order_book
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

NOTIFY pgrst, 'reload schema';

-- Register the Order Book endpoint if it is not configured yet (edit it in SAP API Settings).
INSERT INTO public.sap_endpoints (name, module_key, description, endpoint_path, http_method, auth_type, query_params, headers, body_template, scheduler_enabled, schedule_expression, is_active, posting_range)
SELECT 'ORDER_BOOK', 'common', 'Order Book (ZORDERBOOK) — stored in public.order_book', '/zorderbook/order?sap-client=234', 'POST', 'proxy', '[]'::jsonb, '[]'::jsonb,
  '{"VKORG":"1000","SPART_F":"","SPART_T":"","VTWEG_F":"","VTWEG_T":"","AUART_F":"","AUART_T":"","VBELN_F":"","VBELN_T":"","ERDAT_F":"","ERDAT_T":"","WERKS_F":"","WERKS_T":""}',
  false, 'IST:05:30', true, 'last1m'
WHERE NOT EXISTS (SELECT 1 FROM public.sap_endpoints WHERE regexp_replace(lower(name), '[^a-z0-9]', '', 'g') LIKE '%orderbook%');
