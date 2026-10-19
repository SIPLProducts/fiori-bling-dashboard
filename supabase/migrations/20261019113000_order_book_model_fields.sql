ALTER TABLE public.order_book ADD COLUMN IF NOT EXISTS ld_status text;
ALTER TABLE public.order_book ADD COLUMN IF NOT EXISTS model text;
ALTER TABLE public.order_book ADD COLUMN IF NOT EXISTS range text;
ALTER TABLE public.order_book ADD COLUMN IF NOT EXISTS type text;
UPDATE public.order_book SET ld_status = NULLIF(trim(raw->>'LD_STATUS'),''), model = NULLIF(trim(raw->>'MODEL'),''), range = NULLIF(trim(raw->>'RANGE'),''), type = NULLIF(trim(raw->>'TYPE'),'');
NOTIFY pgrst, 'reload schema';
