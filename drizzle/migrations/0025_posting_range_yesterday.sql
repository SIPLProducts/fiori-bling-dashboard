ALTER TABLE public.sap_endpoints DROP CONSTRAINT IF EXISTS sap_endpoints_posting_range_check;
ALTER TABLE public.sap_endpoints ADD CONSTRAINT sap_endpoints_posting_range_check
  CHECK (posting_range IN ('today', 'yesterday', 'last7d', 'last1m', 'last6m', 'last1y', 'fytd', 'custom'));