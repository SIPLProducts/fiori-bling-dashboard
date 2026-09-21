UPDATE public.zfisales_detail
SET pc_short_name = btrim(raw ->> 'ABTEI')
WHERE NULLIF(btrim(raw ->> 'ABTEI'), '') IS NOT NULL
  AND pc_short_name IS DISTINCT FROM btrim(raw ->> 'ABTEI');

NOTIFY pgrst, 'reload schema';