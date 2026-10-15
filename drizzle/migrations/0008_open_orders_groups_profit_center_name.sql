ALTER TABLE public.open_sales_orders
  ADD COLUMN IF NOT EXISTS profit_center_name text,
  ADD COLUMN IF NOT EXISTS main_group text,
  ADD COLUMN IF NOT EXISTS sub_group text;
UPDATE public.open_sales_orders SET
  profit_center_name = NULLIF(btrim(raw->>'PRCTR_NAME'), ''),
  main_group = NULLIF(btrim(raw->>'MNGRP1'), ''),
  sub_group = NULLIF(btrim(raw->>'PCGRP1'), ''),
  division = COALESCE(NULLIF(btrim(raw->>'DIVISION'), ''), division);