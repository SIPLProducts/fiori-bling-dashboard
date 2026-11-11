ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS mngrp1 text,
  ADD COLUMN IF NOT EXISTS pcgrp1 text,
  ADD COLUMN IF NOT EXISTS pcgrp2 text,
  ADD COLUMN IF NOT EXISTS pcgrp3 text,
  ADD COLUMN IF NOT EXISTS division_name text;
UPDATE public.purchase_orders SET
  mngrp1 = COALESCE(NULLIF(trim(raw->>'MAIN_GROUP'),''), NULLIF(trim(raw->>'MNGRP1'),''), NULLIF(trim(raw->>'MAIN_GRP'),'')),
  pcgrp1 = COALESCE(NULLIF(trim(raw->>'SUB_GROUP'),''), NULLIF(trim(raw->>'PCGRP1'),''), NULLIF(trim(raw->>'SUB_GRP'),'')),
  pcgrp2 = COALESCE(NULLIF(trim(raw->>'SUB_GROUP2'),''), NULLIF(trim(raw->>'PCGRP2'),''), NULLIF(trim(raw->>'SUB_GRP2'),'')),
  pcgrp3 = COALESCE(NULLIF(trim(raw->>'SUB_GROUP3'),''), NULLIF(trim(raw->>'PCGRP3'),''), NULLIF(trim(raw->>'SUB_GRP3'),'')),
  division_name = NULLIF(trim(raw->>'DIVISION_NAME'),'')
WHERE raw IS NOT NULL;
UPDATE public.sap_endpoints SET endpoint_path = '/zpo_list/polist?sap-client=234',
  body_template = '{
  "EBELN": "",
  "WERKS": "",
  "EKGRP": "",
  "BSART": "",
  "MATNR": "",
  "LIFNR": "",
  "BEDAT_FROM": "",
  "BEDAT_TO": ""
}'
WHERE name = 'Purchase_Orders';