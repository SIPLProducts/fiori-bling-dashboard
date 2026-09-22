UPDATE public.zfisales_detail
SET sub_group = NULLIF(btrim(raw ->> 'PCGRP1'), '')
WHERE COALESCE(btrim(sub_group), '') = ''
  AND COALESCE(btrim(raw ->> 'PCGRP1'), '') <> '';

NOTIFY pgrst, 'reload schema';