ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS ekgrp_desc text;
UPDATE public.purchase_orders SET ekgrp_desc = NULLIF(trim(raw->>'EKGRP_DESC'), '') WHERE ekgrp_desc IS NULL AND raw ? 'EKGRP_DESC';
NOTIFY pgrst, 'reload schema';