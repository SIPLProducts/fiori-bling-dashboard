ALTER TABLE public.sap_endpoints
  ADD COLUMN IF NOT EXISTS posting_range text NOT NULL DEFAULT 'custom';

ALTER TABLE public.sap_endpoints
  DROP CONSTRAINT IF EXISTS sap_endpoints_posting_range_check;

ALTER TABLE public.sap_endpoints
  ADD CONSTRAINT sap_endpoints_posting_range_check
  CHECK (posting_range IN ('last7d', 'last1m', 'last6m', 'last1y', 'custom'));