ALTER TABLE public.sap_sync_runs
  ADD COLUMN IF NOT EXISTS response_bytes bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration_ms integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS http_status integer,
  ADD COLUMN IF NOT EXISTS records_skipped integer NOT NULL DEFAULT 0;