ALTER TABLE public.zfisales_detail
  ADD COLUMN IF NOT EXISTS sync_scope_key text,
  ADD COLUMN IF NOT EXISTS snapshot_id uuid,
  ADD COLUMN IF NOT EXISTS row_hash text,
  ADD COLUMN IF NOT EXISTS occurrence_no integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_active_snapshot boolean NOT NULL DEFAULT true;

UPDATE public.zfisales_detail
SET sync_scope_key = COALESCE(sync_scope_key, 'legacy:' || COALESCE(source_endpoint, 'ZFISALES')),
    snapshot_id = COALESCE(snapshot_id, gen_random_uuid()),
    row_hash = COALESCE(row_hash, record_key);

ALTER TABLE public.zfisales_detail
  ALTER COLUMN sync_scope_key SET NOT NULL,
  ALTER COLUMN snapshot_id SET NOT NULL,
  ALTER COLUMN row_hash SET NOT NULL;

CREATE INDEX IF NOT EXISTS zfisales_detail_active_scope_idx
  ON public.zfisales_detail (is_active_snapshot, sync_scope_key);
CREATE INDEX IF NOT EXISTS zfisales_detail_snapshot_idx
  ON public.zfisales_detail (snapshot_id);

ALTER TABLE public.sap_sync_runs
  ADD COLUMN IF NOT EXISTS records_stored integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS records_replaced integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS records_invalid integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sync_scope_key text,
  ADD COLUMN IF NOT EXISTS snapshot_id uuid;

CREATE OR REPLACE FUNCTION public.activate_zfisales_snapshot(
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
  _replaced_count integer;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden: Sharvi Admin role required';
  END IF;

  SELECT count(*)::integer INTO _staged_count
  FROM public.zfisales_detail
  WHERE sync_scope_key = _scope_key
    AND snapshot_id = _snapshot_id
    AND is_active_snapshot = false;

  IF _staged_count <> _expected_count THEN
    RAISE EXCEPTION 'Snapshot row count mismatch: expected %, staged %', _expected_count, _staged_count;
  END IF;

  DELETE FROM public.zfisales_detail
  WHERE sync_scope_key = _scope_key
    AND is_active_snapshot = true;
  GET DIAGNOSTICS _replaced_count = ROW_COUNT;

  UPDATE public.zfisales_detail
  SET is_active_snapshot = true
  WHERE sync_scope_key = _scope_key
    AND snapshot_id = _snapshot_id
    AND is_active_snapshot = false;

  RETURN _replaced_count;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_zfisales_snapshot(text, uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activate_zfisales_snapshot(text, uuid, integer) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.net_sales_summary()
RETURNS TABLE(total numeric, sales_type text, type_total numeric)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(sum(d.amount), 0)::numeric AS total,
    COALESCE(NULLIF(trim(d.sales_type), ''), 'Other') AS sales_type,
    COALESCE(sum(d.amount), 0)::numeric AS type_total
  FROM public.zfisales_detail d
  WHERE d.is_active_snapshot = true
  GROUP BY 2;
$$;