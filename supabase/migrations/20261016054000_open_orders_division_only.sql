-- Open Orders: Division comes from SAP DIVISION only (never SPART).
UPDATE public.open_sales_orders
SET division = NULLIF(trim(raw->>'DIVISION'), '')
WHERE division IS DISTINCT FROM NULLIF(trim(raw->>'DIVISION'), '');
NOTIFY pgrst, 'reload schema';
