-- Fill group hierarchy columns from MAIN_GRP/SUB_GRP/SUB_GRP2/SUB_GRP3 raw keys.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['sales_register','sales_in_transit','order_book'] LOOP
    EXECUTE format($f$UPDATE public.%I SET
      mngrp1 = COALESCE(NULLIF(btrim(raw->>'MNGRP1'),''), NULLIF(btrim(raw->>'MAIN_GRP'),''), mngrp1),
      pcgrp1 = COALESCE(NULLIF(btrim(raw->>'PCGRP1'),''), NULLIF(btrim(raw->>'SUB_GRP'),''), pcgrp1),
      pcgrp2 = COALESCE(NULLIF(btrim(raw->>'PCGRP2'),''), NULLIF(btrim(raw->>'SUB_GRP2'),''), pcgrp2),
      pcgrp3 = COALESCE(NULLIF(btrim(raw->>'PCGRP3'),''), NULLIF(btrim(raw->>'SUB_GRP3'),''), pcgrp3)
      WHERE raw ?| ARRAY['MAIN_GRP','SUB_GRP','SUB_GRP2','SUB_GRP3']$f$, t);
  END LOOP;
END $$;
