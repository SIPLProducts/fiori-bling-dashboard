ALTER TABLE public.open_purchase_order ADD COLUMN IF NOT EXISTS plt_short text;
UPDATE public.open_purchase_order SET plt_short = NULLIF(btrim(raw->>'PLT_SHORT'), '') WHERE plt_short IS NULL AND raw ? 'PLT_SHORT';
NOTIFY pgrst, 'reload schema';