CREATE TABLE IF NOT EXISTS public.open_purchase_order (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ebeln text NOT NULL,
  ebelp text NOT NULL DEFAULT '',
  werks text, plt_name text, bsart text, lgort text, ekgrp text, elikz text,
  bedat date, lifnr text, name1 text, loekz text, matnr text, txz01 text,
  menge numeric, meins text, netwr numeric, menge1 numeric, meins1 text, dmbtr1 numeric, wrbtr numeric,
  eindt date, datum date, lv_menge_sum numeric, days numeric, eknam text, buyer text, creat text,
  mngrp1 text, pcgrp1 text, pcgrp2 text, pcgrp3 text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_endpoint text,
  synced_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT open_purchase_order_line_key UNIQUE (ebeln, ebelp)
);
CREATE INDEX IF NOT EXISTS open_purchase_order_bedat_idx ON public.open_purchase_order (bedat);
CREATE INDEX IF NOT EXISTS open_purchase_order_werks_idx ON public.open_purchase_order (werks);
GRANT SELECT ON public.open_purchase_order TO authenticated;
GRANT ALL ON public.open_purchase_order TO service_role;
ALTER TABLE public.open_purchase_order ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open purchase orders visible by access" ON public.open_purchase_order FOR SELECT TO authenticated
  USING ((SELECT public.has_screen(auth.uid(), 'mm.open-purchase-orders')) AND public.user_can_see(werks, NULL));