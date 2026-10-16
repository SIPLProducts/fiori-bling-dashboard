ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profit_center text;
NOTIFY pgrst, 'reload schema';
