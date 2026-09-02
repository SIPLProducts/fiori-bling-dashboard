ALTER TABLE public.zfisales_detail ADD COLUMN IF NOT EXISTS business_segment text;
CREATE INDEX IF NOT EXISTS idx_zfisales_detail_business_segment ON public.zfisales_detail (business_segment);