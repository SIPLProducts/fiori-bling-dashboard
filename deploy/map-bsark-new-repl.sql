UPDATE public.zfisales_detail
SET new_repl = btrim(raw ->> 'BSARK')
WHERE NULLIF(btrim(new_repl), '') IS NULL
  AND NULLIF(btrim(raw ->> 'BSARK'), '') IS NOT NULL;

NOTIFY pgrst, 'reload schema';