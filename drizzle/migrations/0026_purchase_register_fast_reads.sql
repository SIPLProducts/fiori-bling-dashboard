CREATE INDEX IF NOT EXISTS purchase_register_budat_id_idx ON public.purchase_register (budat, id);

CREATE OR REPLACE FUNCTION public.purchase_register_kpis(_from date, _to date)
RETURNS TABLE(ty_purch text, line_count bigint, total_value numeric)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path TO 'public'
AS $$
  SELECT COALESCE(NULLIF(trim(p.ty_purch), ''), 'Domestic'), count(*),
    COALESCE(sum(CASE WHEN upper(trim(p.shkzg)) = 'H' AND p.net_amt > 0 THEN -p.net_amt ELSE p.net_amt END), 0)
  FROM public.purchase_register p
  WHERE p.budat >= _from AND p.budat <= _to
  GROUP BY 1;
$$;

CREATE OR REPLACE FUNCTION public.purchase_register_fiscal_years()
RETURNS TABLE(fy_start integer)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path TO 'public'
AS $$
  SELECT DISTINCT (CASE WHEN extract(month FROM p.budat) >= 4 THEN extract(year FROM p.budat) ELSE extract(year FROM p.budat) - 1 END)::integer
  FROM public.purchase_register p WHERE p.budat IS NOT NULL ORDER BY 1 DESC;
$$;

GRANT EXECUTE ON FUNCTION public.purchase_register_kpis(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_register_fiscal_years() TO authenticated;