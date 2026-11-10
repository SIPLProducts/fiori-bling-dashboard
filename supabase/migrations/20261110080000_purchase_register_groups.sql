ALTER TABLE public.purchase_register
  ADD COLUMN IF NOT EXISTS mngrp1 text,
  ADD COLUMN IF NOT EXISTS pcgrp1 text,
  ADD COLUMN IF NOT EXISTS pcgrp2 text,
  ADD COLUMN IF NOT EXISTS pcgrp3 text;

UPDATE public.purchase_register SET
  mngrp1 = NULLIF(btrim(COALESCE(raw->>'MNGRP1', raw->>'MAIN_GRP')), ''),
  pcgrp1 = NULLIF(btrim(COALESCE(raw->>'PCGRP1', raw->>'SUB_GRP')), ''),
  pcgrp2 = NULLIF(btrim(COALESCE(raw->>'PCGRP2', raw->>'SUB_GRP2')), ''),
  pcgrp3 = NULLIF(btrim(COALESCE(raw->>'PCGRP3', raw->>'SUB_GRP3')), '')
WHERE raw IS NOT NULL AND mngrp1 IS NULL AND pcgrp1 IS NULL AND pcgrp2 IS NULL AND pcgrp3 IS NULL;
