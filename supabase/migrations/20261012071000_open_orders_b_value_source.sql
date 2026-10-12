ALTER TABLE public.open_sales_orders ADD COLUMN IF NOT EXISTS b_value numeric NOT NULL DEFAULT 0;
WITH source_values AS (
  SELECT id, btrim(replace(COALESCE(raw->>'B_VALUE', raw->>'b_value', ''), ',', '')) AS value_text
  FROM public.open_sales_orders
), normalized AS (
  SELECT id, CASE WHEN value_text ~ '^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$' THEN value_text::numeric WHEN value_text ~ '^([0-9]+([.][0-9]*)?|[.][0-9]+)-$' THEN -left(value_text, length(value_text)-1)::numeric ELSE 0 END AS value
  FROM source_values
)
UPDATE public.open_sales_orders AS orders SET b_value = normalized.value, open_value = normalized.value FROM normalized WHERE orders.id = normalized.id;
COMMENT ON COLUMN public.open_sales_orders.b_value IS 'SAP B_VALUE original rupee amount; sole Open Value source, no KWERT_INR or NETWR fallback and no quantity scaling.';
COMMENT ON COLUMN public.open_sales_orders.kwert_inr IS 'SAP KWERT_INR original rupee amount retained independently; DEPRECATED as Open Value source, replaced by b_value.';
COMMENT ON COLUMN public.open_sales_orders.open_value IS 'Compatibility mirror of b_value populated by the shared SAP mapper; reports read b_value.';