CREATE OR REPLACE FUNCTION public.activate_zfisales_snapshot(
  _scope_key text,
  _snapshot_id uuid,
  _expected_count integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
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