DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['open_sales_orders','zfisales_detail','sales_in_transit','order_book','sales_register'] LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS mngrp1 text, ADD COLUMN IF NOT EXISTS pcgrp1 text, ADD COLUMN IF NOT EXISTS pcgrp2 text, ADD COLUMN IF NOT EXISTS pcgrp3 text', t);
    EXECUTE format('UPDATE public.%I SET mngrp1 = NULLIF(btrim(raw->>''MNGRP1''), ''''), pcgrp1 = NULLIF(btrim(raw->>''PCGRP1''), ''''), pcgrp2 = NULLIF(btrim(raw->>''PCGRP2''), ''''), pcgrp3 = NULLIF(btrim(raw->>''PCGRP3''), '''') WHERE raw ?| ARRAY[''MNGRP1'',''PCGRP1'',''PCGRP2'',''PCGRP3'']', t);
  END LOOP;
END $$;