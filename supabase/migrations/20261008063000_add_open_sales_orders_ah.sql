ALTER TABLE public.open_sales_orders
  ADD COLUMN IF NOT EXISTS ah numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_ah numeric NOT NULL DEFAULT 0;

WITH source_values AS (
  SELECT id,
    regexp_replace(btrim(coalesce(raw->>'AH', raw->>'ah', '')), '[,[:space:]]', '', 'g') AS ah_text,
    regexp_replace(btrim(coalesce(raw->>'TOT_AH', raw->>'tot_ah', '')), '[,[:space:]]', '', 'g') AS total_ah_text
  FROM public.open_sales_orders
), normalized AS (
  SELECT id,
    CASE WHEN ah_text ~ '^[+]?[0-9]*[.]?[0-9]+-$' THEN '-' || rtrim(ah_text, '-') ELSE ah_text END AS ah_text,
    CASE WHEN total_ah_text ~ '^[+]?[0-9]*[.]?[0-9]+-$' THEN '-' || rtrim(total_ah_text, '-') ELSE total_ah_text END AS total_ah_text
  FROM source_values
)
UPDATE public.open_sales_orders AS orders
SET ah = CASE WHEN normalized.ah_text ~ '^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$' THEN normalized.ah_text::numeric ELSE 0 END,
    total_ah = CASE WHEN normalized.total_ah_text ~ '^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$' THEN normalized.total_ah_text::numeric ELSE 0 END
FROM normalized
WHERE orders.id = normalized.id;

COMMENT ON COLUMN public.open_sales_orders.ah IS 'SAP AH, stored as an unscaled numeric value.';
COMMENT ON COLUMN public.open_sales_orders.total_ah IS 'SAP TOT_AH, stored as an unscaled numeric value.';
NOTIFY pgrst, 'reload schema';