-- ZCASHFLOWN cash flow balances. One row per Profit Center + Plant + GL Code,
-- inserted or updated in place on every sync (no snapshots).
CREATE TABLE IF NOT EXISTS public.zcash_flow (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profit_center text NOT NULL DEFAULT '',
  plant text NOT NULL DEFAULT '',
  gl_code text NOT NULL DEFAULT '',
  profit_center_name text,
  group_name text,
  gl_name text,
  classification text,
  nature text,
  profit_center_group text,
  debit numeric NOT NULL DEFAULT 0,
  credit numeric NOT NULL DEFAULT 0,
  net numeric NOT NULL DEFAULT 0,
  collection_disbursement text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_endpoint text NOT NULL DEFAULT 'ZCASH_FLOW',
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT zcash_flow_unique_key UNIQUE (profit_center, plant, gl_code)
);
GRANT SELECT ON public.zcash_flow TO authenticated;
GRANT ALL ON public.zcash_flow TO service_role;
ALTER TABLE public.zcash_flow ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS zcash_flow_authorized_read ON public.zcash_flow;
CREATE POLICY zcash_flow_authorized_read ON public.zcash_flow FOR SELECT TO authenticated
  USING (public.has_screen(auth.uid(), 'fi.cash-flow'));
CREATE INDEX IF NOT EXISTS zcash_flow_plant_idx ON public.zcash_flow (plant);
CREATE INDEX IF NOT EXISTS zcash_flow_gl_code_idx ON public.zcash_flow (gl_code);
DROP TRIGGER IF EXISTS update_zcash_flow_updated_at ON public.zcash_flow;
CREATE TRIGGER update_zcash_flow_updated_at BEFORE UPDATE ON public.zcash_flow
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
NOTIFY pgrst, 'reload schema';