CREATE OR REPLACE FUNCTION public.net_sales_summary(_posting_from date, _posting_to date)
RETURNS TABLE(total numeric, sales_type text, type_total numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(sum(d.amount), 0)::numeric AS total,
    COALESCE(NULLIF(trim(d.sales_type), ''), 'Other') AS sales_type,
    COALESCE(sum(d.amount), 0)::numeric AS type_total
  FROM public.zfisales_detail d
  WHERE d.is_active_snapshot = true
    AND d.posting_date >= _posting_from
    AND d.posting_date <= _posting_to
  GROUP BY 2;
$$;

REVOKE ALL ON FUNCTION public.net_sales_summary(date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.net_sales_summary(date, date) TO authenticated, service_role;