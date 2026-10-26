-- Allows the "Current date" (today) date window in SAP API Settings. Safe to rerun.
ALTER TABLE public.sap_endpoints DROP CONSTRAINT IF EXISTS sap_endpoints_posting_range_check;
ALTER TABLE public.sap_endpoints ADD CONSTRAINT sap_endpoints_posting_range_check
  CHECK (posting_range IN ('today','last7d','last1m','last6m','last1y','custom'));
NOTIFY pgrst, 'reload schema';
