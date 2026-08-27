ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plant text,
  ADD COLUMN IF NOT EXISTS purchase_group text,
  ADD COLUMN IF NOT EXISTS distribution_channel text;