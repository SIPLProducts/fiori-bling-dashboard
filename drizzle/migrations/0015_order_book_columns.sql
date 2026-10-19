DO $$
DECLARE c text;
BEGIN
  FOREACH c IN ARRAY ARRAY['apptyp','sector','vtweg','spart','plant','auart','kunnr_sp','name1_sp','kunnr_bp','name1_bp','kunnr_sh','name1_sh','bstnk','matnr','maktx','vrkme','waerk','zterm','pay_vtext','delv_dat','warty','inco1','ld_terms','vkbur','name1_se','vtext_dc','vtext_di','inco2','meins','bezei','landx_sp','bezei_sp','landx_bp','bezei_bp','landx_sh','bezei_sh','vgbel','proj','vkgrp','year','absta','gbsta','buy_back','buy_back_detail','unload','plant_name','div_name','profit_center','pc_name','main_grp','sub_grp'] LOOP
    EXECUTE format('ALTER TABLE public.order_book ADD COLUMN IF NOT EXISTS %I text', c);
  END LOOP;
  FOREACH c IN ARRAY ARRAY['kwmeng','kwmeng_p','stcur','kbetr','kwmeng_c','kwmeng_pc','p_value','kwert_ba','kwert_bc','kwert_bci','kwert_ds','kwert_ed','kwert_cst','kwert_vat','kwert_st','kwert_sw','kwert_gst','kwert_kkc','kwert_vsc','netwr','kwert_fr','znrc','zcom','zpf1','ztax','zdst','kf00','zf01','zf02','kursk','tot_inr','net_inr','umren','tot_ah','basic_ah','basic_ahinr','umvkz','twar','kwert_zsbp','kwert_zsf1','kwert_zsf2'] LOOP
    EXECUTE format('ALTER TABLE public.order_book ADD COLUMN IF NOT EXISTS %I numeric NOT NULL DEFAULT 0', c);
  END LOOP;
END $$;
ALTER TABLE public.order_book ADD COLUMN IF NOT EXISTS sales_order text NOT NULL DEFAULT '';
ALTER TABLE public.order_book ADD COLUMN IF NOT EXISTS sales_order_item text NOT NULL DEFAULT '';
ALTER TABLE public.order_book ADD COLUMN IF NOT EXISTS created_date date;
ALTER TABLE public.order_book ADD COLUMN IF NOT EXISTS bstdk date;
ALTER TABLE public.order_book ADD COLUMN IF NOT EXISTS raw jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.order_book ADD COLUMN IF NOT EXISTS source_endpoint text NOT NULL DEFAULT '';
ALTER TABLE public.order_book ADD COLUMN IF NOT EXISTS synced_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.order_book ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.order_book ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.order_book ADD CONSTRAINT order_book_sales_order_item_key UNIQUE (sales_order, sales_order_item);
GRANT SELECT ON public.order_book TO authenticated;
GRANT ALL ON public.order_book TO service_role;
ALTER TABLE public.order_book ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Order book visible by plant or profit centre" ON public.order_book
  FOR SELECT TO authenticated USING (public.user_can_see(plant, profit_center));
CREATE INDEX IF NOT EXISTS order_book_created_date_idx ON public.order_book (created_date);
CREATE INDEX IF NOT EXISTS order_book_plant_idx ON public.order_book (plant);
CREATE INDEX IF NOT EXISTS order_book_profit_center_idx ON public.order_book (profit_center);
CREATE TRIGGER update_order_book_updated_at BEFORE UPDATE ON public.order_book
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
NOTIFY pgrst, 'reload schema';