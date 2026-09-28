DROP FUNCTION IF EXISTS public.activate_zfisales_snapshot(text, uuid, integer);

CREATE OR REPLACE FUNCTION public.activate_zfisales_snapshot(
  _scope_key text,
  _snapshot_id uuid,
  _expected_count integer,
  _posting_from date,
  _posting_to date
)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _staged_count integer;
  _invalid_range_count integer;
  _replaced_count integer;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden: Sharvi Admin role required';
  END IF;

  IF _expected_count <= 0 THEN
    RAISE EXCEPTION 'A non-empty validated snapshot is required';
  END IF;

  IF _posting_from IS NULL OR _posting_to IS NULL OR _posting_from > _posting_to THEN
    RAISE EXCEPTION 'A valid Posting Date range is required';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('zfisales_snapshot_activation', 0));

  SELECT count(*)::integer INTO _staged_count
  FROM public.zfisales_detail
  WHERE sync_scope_key = _scope_key
    AND snapshot_id = _snapshot_id
    AND is_active_snapshot = false;

  IF _staged_count <> _expected_count THEN
    RAISE EXCEPTION 'Snapshot row count mismatch: expected %, staged %', _expected_count, _staged_count;
  END IF;

  SELECT count(*)::integer INTO _invalid_range_count
  FROM public.zfisales_detail
  WHERE sync_scope_key = _scope_key
    AND snapshot_id = _snapshot_id
    AND is_active_snapshot = false
    AND (posting_date IS NULL OR posting_date < _posting_from OR posting_date > _posting_to);

  IF _invalid_range_count <> 0 THEN
    RAISE EXCEPTION 'Snapshot contains % rows outside the validated Posting Date range', _invalid_range_count;
  END IF;

  DELETE FROM public.zfisales_detail
  WHERE is_active_snapshot = true
    AND posting_date BETWEEN _posting_from AND _posting_to;
  GET DIAGNOSTICS _replaced_count = ROW_COUNT;

  UPDATE public.zfisales_detail
  SET is_active_snapshot = true
  WHERE sync_scope_key = _scope_key
    AND snapshot_id = _snapshot_id
    AND is_active_snapshot = false;

  RETURN _replaced_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.activate_zfisales_snapshot(text, uuid, integer, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_zfisales_snapshot(text, uuid, integer, date, date) TO service_role;