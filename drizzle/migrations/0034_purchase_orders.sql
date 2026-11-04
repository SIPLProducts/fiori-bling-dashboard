CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po text NOT NULL,
  po_item text NOT NULL DEFAULT '',
  po_date date, delivery_date date, doc_date date, no_of_days numeric,
  po_doc_type text, po_doc_category text, vendor_supplying_plant text, purchase_org text, purchasing_group text,
  material text, short_text text, material_group text, po_history_release_doc text, deletion_ind text,
  item_category text, item_category_epstp text, account_assignment_cat text, tracking_number text,
  plant text, plt_name text, plt_short text, storage_location text,
  order_quantity numeric, order_unit text, net_price numeric, currency_key text, price_unit numeric,
  agreement text, agreement_item numeric,
  still_to_be_delivered_qty numeric, still_to_be_delivered_val numeric, still_to_be_invoiced_qty numeric, still_to_be_invoiced_val numeric,
  rfq_status text, collective_no text, no_of_positions numeric, purchasing_info_rec text, package_no numeric,
  release_group text, release_strategy text, release_status text, release_indicator text,
  name_of_vendor text, order_price_unit text, tax_code text, net_order_value numeric, asset_code text, wbs_element text,
  zzbanfn text, zzitext text, zzinter text, zzsteuc text, user_id text, user_name text, buyer text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_endpoint text,
  synced_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT purchase_orders_line_key UNIQUE (po, po_item)
);
CREATE INDEX IF NOT EXISTS purchase_orders_po_date_idx ON public.purchase_orders (po_date);
CREATE INDEX IF NOT EXISTS purchase_orders_plant_idx ON public.purchase_orders (plant);
GRANT SELECT ON public.purchase_orders TO authenticated;
GRANT ALL ON public.purchase_orders TO service_role;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Purchase orders visible by access" ON public.purchase_orders FOR SELECT TO authenticated
  USING ((SELECT public.has_screen(auth.uid(), 'mm.purchase-orders')) AND public.user_can_see(plant, NULL));
INSERT INTO public.sap_endpoints (name, module_key, description, endpoint_path, system_key, http_method, auth_type, body_template, posting_range, is_active)
SELECT 'Purchase_Orders','common','ZME2N purchase orders','/zme2n/me2n?sap-client=234','dev','POST','proxy',
'{
  "purchasing_document": [],
  "plant": [],
  "purchasing_group": [],
  "document_type": [],
  "material": [],
  "vendor": [],
  "document_date": { "from_date": "", "to_date": "" },
  "status": "R6",
  "mail": ""
}','today',true
WHERE NOT EXISTS (SELECT 1 FROM public.sap_endpoints WHERE name='Purchase_Orders');
NOTIFY pgrst, 'reload schema';