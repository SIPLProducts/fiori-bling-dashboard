CREATE OR REPLACE FUNCTION public.purchase_register_kpis(_from date, _to date)
RETURNS TABLE(ty_purch text, line_count bigint, total_value numeric)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path TO 'public'
AS $$
  SELECT COALESCE(NULLIF(trim(p.ty_purch), ''), 'Domestic'), count(*),
    COALESCE(sum(CASE WHEN upper(trim(p.shkzg)) = 'H' AND p.net_amt > 0 THEN -p.net_amt ELSE p.net_amt END), 0)
  FROM public.purchase_register p
  WHERE p.budat >= _from AND p.budat <= _to
    AND ((SELECT public.current_access_unrestricted())
      OR COALESCE(p.werks, '') = ANY ((SELECT public.current_access_plants())::text[])
      OR COALESCE(p.prctr, '') = ANY ((SELECT public.current_access_profit_centers())::text[]))
  GROUP BY 1;
$$;
GRANT EXECUTE ON FUNCTION public.purchase_register_kpis(date, date) TO authenticated;

DROP POLICY IF EXISTS sap_masters_read ON public.sap_masters;
CREATE POLICY sap_masters_read ON public.sap_masters FOR SELECT TO authenticated
USING (public.is_data_admin(auth.uid()) OR public.has_screen(auth.uid(), 'tables.' || replace(category, '_', '-'))
  OR (category = 'zrmmat' AND (public.has_screen(auth.uid(), 'mm.purchase-register') OR public.has_screen(auth.uid(), 'mm.purchase-orders'))));

NOTIFY pgrst, 'reload schema';