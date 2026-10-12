ALTER TABLE public.open_sales_orders ADD COLUMN IF NOT EXISTS p_value1 numeric NOT NULL DEFAULT 0;
WITH source_values AS (
  SELECT id, btrim(replace(COALESCE(NULLIF(btrim(raw->>'P_VALUE1'), ''), raw->>'p_value1', ''), ',', '')) AS value_text
  FROM public.open_sales_orders
), normalized AS (
  SELECT id, CASE WHEN value_text ~ '^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$' THEN value_text::numeric WHEN value_text ~ '^([0-9]+([.][0-9]*)?|[.][0-9]+)-$' THEN -left(value_text, length(value_text)-1)::numeric ELSE 0 END AS value
  FROM source_values
)
UPDATE public.open_sales_orders AS orders SET p_value1 = normalized.value, open_value = normalized.value FROM normalized WHERE orders.id = normalized.id;
COMMENT ON COLUMN public.open_sales_orders.p_value1 IS 'SAP P_VALUE1 original rupee amount; sole Open Value source, no B_VALUE, KWERT_INR or NETWR fallback and no quantity scaling.';
COMMENT ON COLUMN public.open_sales_orders.b_value IS 'SAP B_VALUE original rupee amount retained independently; DEPRECATED as Open Value source, replaced by p_value1.';
COMMENT ON COLUMN public.open_sales_orders.kwert_inr IS 'SAP KWERT_INR original rupee amount retained independently; DEPRECATED as Open Value source, replaced by p_value1.';
COMMENT ON COLUMN public.open_sales_orders.open_value IS 'Compatibility mirror of p_value1 populated by the shared SAP mapper; reports read p_value1.';