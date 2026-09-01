ALTER TABLE public.zfisales_detail
  ADD COLUMN IF NOT EXISTS amount_domestic numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_export numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_service numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_gross numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_net numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS excise_duty numeric NOT NULL DEFAULT 0;