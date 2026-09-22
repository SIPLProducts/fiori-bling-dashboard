CREATE TABLE public.open_sales_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_key text NOT NULL UNIQUE,
  sync_scope_key text NOT NULL,
  snapshot_id uuid NOT NULL,
  row_hash text NOT NULL,
  occurrence_no integer NOT NULL DEFAULT 1,
  is_active_snapshot boolean NOT NULL DEFAULT false,
  sales_order text NOT NULL,
  sales_order_item text,
  preceding_document text,
  purchase_order text,
  order_type text,
  order_date date,
  purchase_order_date date,
  delivery_date date,
  sales_org text,
  distribution_channel text,
  division text,
  plant text,
  sales_office text,
  sales_group text,
  profit_center text,
  customer_sold_to text,
  customer_sold_to_name text,
  customer_bill_to text,
  customer_bill_to_name text,
  customer_ship_to text,
  customer_ship_to_name text,
  material text,
  material_description text,
  material_type text,
  product_category text,
  region text,
  country text,
  sales_type text,
  quantity numeric NOT NULL DEFAULT 0,
  open_quantity numeric NOT NULL DEFAULT 0,
  unit text,
  currency text,
  open_value numeric NOT NULL DEFAULT 0,
  days_open integer NOT NULL DEFAULT 0,
  delivery_status text,
  overall_status text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_endpoint text NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sync_scope_key, snapshot_id, row_hash, occurrence_no)
);
GRANT SELECT ON public.open_sales_orders TO authenticated;
GRANT ALL ON public.open_sales_orders TO service_role;
ALTER TABLE public.open_sales_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY open_sales_orders_authorized_read ON public.open_sales_orders FOR SELECT TO authenticated USING (is_active_snapshot = true AND public.has_screen(auth.uid(), 'sd.open-sales-orders'));
CREATE INDEX open_sales_orders_active_scope_idx ON public.open_sales_orders (is_active_snapshot, sync_scope_key);
CREATE INDEX open_sales_orders_snapshot_idx ON public.open_sales_orders (snapshot_id);
CREATE INDEX open_sales_orders_order_date_idx ON public.open_sales_orders (order_date) WHERE is_active_snapshot = true;
CREATE INDEX open_sales_orders_filters_idx ON public.open_sales_orders (sales_org, distribution_channel, sales_office, sales_group) WHERE is_active_snapshot = true;
CREATE TRIGGER update_open_sales_orders_updated_at BEFORE UPDATE ON public.open_sales_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE FUNCTION public.activate_open_sales_orders_snapshot(_scope_key text, _snapshot_id uuid, _expected_count integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _staged_count integer; _replaced_count integer;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_super_admin(auth.uid()) THEN RAISE EXCEPTION 'Forbidden: Sharvi Admin role required'; END IF;
  SELECT count(*)::integer INTO _staged_count FROM public.open_sales_orders WHERE sync_scope_key = _scope_key AND snapshot_id = _snapshot_id AND is_active_snapshot = false;
  IF _staged_count <> _expected_count THEN RAISE EXCEPTION 'Snapshot row count mismatch: expected %, staged %', _expected_count, _staged_count; END IF;
  DELETE FROM public.open_sales_orders WHERE sync_scope_key = _scope_key AND is_active_snapshot = true;
  GET DIAGNOSTICS _replaced_count = ROW_COUNT;
  UPDATE public.open_sales_orders SET is_active_snapshot = true WHERE sync_scope_key = _scope_key AND snapshot_id = _snapshot_id AND is_active_snapshot = false;
  RETURN _replaced_count;
END;
$$;
REVOKE ALL ON FUNCTION public.activate_open_sales_orders_snapshot(text, uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activate_open_sales_orders_snapshot(text, uuid, integer) TO authenticated, service_role;
NOTIFY pgrst, 'reload schema';