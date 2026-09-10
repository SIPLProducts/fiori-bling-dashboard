CREATE OR REPLACE FUNCTION public.start_sync_run(
  _endpoint text,
  _started_at timestamptz,
  _request_snapshot jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _run_id uuid;
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden: Sharvi Admin role required';
  END IF;

  INSERT INTO public.sap_sync_runs (endpoint, status, started_at, request_snapshot)
  VALUES (_endpoint, 'running', COALESCE(_started_at, now()), _request_snapshot)
  RETURNING id INTO _run_id;

  RETURN _run_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.finish_sync_run(
  _run_id uuid,
  _status text,
  _records_received integer DEFAULT 0,
  _records_inserted integer DEFAULT 0,
  _records_updated integer DEFAULT 0,
  _records_skipped integer DEFAULT 0,
  _response_bytes bigint DEFAULT 0,
  _duration_ms integer DEFAULT 0,
  _http_status integer DEFAULT NULL,
  _message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _endpoint text;
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden: Sharvi Admin role required';
  END IF;
  IF _status NOT IN ('success', 'error', 'skipped') THEN
    RAISE EXCEPTION 'Invalid sync status';
  END IF;

  UPDATE public.sap_sync_runs
  SET status = _status,
      finished_at = now(),
      records_received = GREATEST(COALESCE(_records_received, 0), 0),
      records_inserted = GREATEST(COALESCE(_records_inserted, 0), 0),
      records_updated = GREATEST(COALESCE(_records_updated, 0), 0),
      records_skipped = GREATEST(COALESCE(_records_skipped, 0), 0),
      response_bytes = GREATEST(COALESCE(_response_bytes, 0), 0),
      duration_ms = GREATEST(COALESCE(_duration_ms, 0), 0),
      http_status = _http_status,
      error_message = NULLIF(_message, '')
  WHERE id = _run_id
  RETURNING endpoint INTO _endpoint;

  IF _endpoint IS NULL THEN
    RAISE EXCEPTION 'Sync run not found';
  END IF;

  DELETE FROM public.sap_sync_runs
  WHERE endpoint = _endpoint
    AND id NOT IN (
      SELECT id FROM public.sap_sync_runs
      WHERE endpoint = _endpoint
      ORDER BY started_at DESC
      LIMIT 6
    );
END;
$$;

REVOKE ALL ON FUNCTION public.start_sync_run(text, timestamptz, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.finish_sync_run(uuid, text, integer, integer, integer, integer, bigint, integer, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_sync_run(text, timestamptz, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.finish_sync_run(uuid, text, integer, integer, integer, integer, bigint, integer, integer, text) TO authenticated, service_role;