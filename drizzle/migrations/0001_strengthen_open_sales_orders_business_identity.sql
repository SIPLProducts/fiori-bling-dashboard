ALTER TABLE public.open_sales_orders
  ADD COLUMN IF NOT EXISTS plant_name text,
  ADD COLUMN IF NOT EXISTS sales_rep_name text,
  ADD COLUMN IF NOT EXISTS industry_description text,
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS product_range text,
  ADD COLUMN IF NOT EXISTS product_type text,
  ADD COLUMN IF NOT EXISTS sales_zone text,
  ADD COLUMN IF NOT EXISTS customer_group text,
  ADD COLUMN IF NOT EXISTS usage_description text,
  ADD COLUMN IF NOT EXISTS delivered_quantity numeric NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS open_sales_orders_active_business_key_idx
  ON public.open_sales_orders (sales_order, sales_order_item)
  WHERE is_active_snapshot = true;

CREATE INDEX IF NOT EXISTS open_sales_orders_document_type_idx
  ON public.open_sales_orders (order_type)
  WHERE is_active_snapshot = true;

CREATE OR REPLACE FUNCTION public.activate_open_sales_orders_snapshot(
  _scope_key text,
  _snapshot_id uuid,
  _expected_count integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _staged_count integer;
  _duplicate_count integer;
  _invalid_key_count integer;
  _replaced_count integer;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden: Sharvi Admin role required';
  END IF;

  IF _expected_count <= 0 THEN
    RAISE EXCEPTION 'A non-empty validated Open Sales Orders snapshot is required';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('open_sales_orders_snapshot_activation', 0));

  SELECT count(*)::integer INTO _staged_count
  FROM public.open_sales_orders
  WHERE sync_scope_key = _scope_key
    AND snapshot_id = _snapshot_id
    AND is_active_snapshot = false;

  IF _staged_count <> _expected_count THEN
    RAISE EXCEPTION 'Snapshot row count mismatch: expected %, staged %', _expected_count, _staged_count;
  END IF;

  SELECT count(*)::integer INTO _invalid_key_count
  FROM public.open_sales_orders
  WHERE sync_scope_key = _scope_key
    AND snapshot_id = _snapshot_id
    AND is_active_snapshot = false
    AND (btrim(sales_order) = '' OR sales_order_item IS NULL OR btrim(sales_order_item) = '');

  IF _invalid_key_count <> 0 THEN
    RAISE EXCEPTION 'Snapshot contains % rows without VBELN + POSNR', _invalid_key_count;
  END IF;

  SELECT count(*)::integer INTO _duplicate_count
  FROM (
    SELECT sales_order, sales_order_item
    FROM public.open_sales_orders
    WHERE sync_scope_key = _scope_key
      AND snapshot_id = _snapshot_id
      AND is_active_snapshot = false
    GROUP BY sales_order, sales_order_item
    HAVING count(*) > 1
  ) duplicates;

  IF _duplicate_count <> 0 THEN
    RAISE EXCEPTION 'Snapshot contains % duplicate VBELN + POSNR keys', _duplicate_count;
  END IF;

  DELETE FROM public.open_sales_orders
  WHERE is_active_snapshot = true;
  GET DIAGNOSTICS _replaced_count = ROW_COUNT;

  UPDATE public.open_sales_orders
  SET is_active_snapshot = true
  WHERE sync_scope_key = _scope_key
    AND snapshot_id = _snapshot_id
    AND is_active_snapshot = false;

  RETURN _replaced_count;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_open_sales_orders_snapshot(text, uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_open_sales_orders_snapshot(text, uuid, integer) TO service_role;

NOTIFY pgrst, 'reload schema';