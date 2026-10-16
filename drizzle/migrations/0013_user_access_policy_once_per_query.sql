CREATE OR REPLACE FUNCTION public.current_access_unrestricted()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_data_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND cardinality(p.plants) = 0 AND cardinality(p.profit_centers) = 0
  );
$$;
CREATE OR REPLACE FUNCTION public.current_access_plants()
RETURNS text[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce((SELECT p.plants FROM public.profiles p WHERE p.id = auth.uid()), '{}'::text[]);
$$;
CREATE OR REPLACE FUNCTION public.current_access_profit_centers()
RETURNS text[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce((SELECT p.profit_centers FROM public.profiles p WHERE p.id = auth.uid()), '{}'::text[]);
$$;
GRANT EXECUTE ON FUNCTION public.current_access_unrestricted() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_access_plants() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_access_profit_centers() TO authenticated;
DROP POLICY IF EXISTS zfisales_detail_read_authenticated ON public.zfisales_detail;
CREATE POLICY zfisales_detail_read_authenticated ON public.zfisales_detail FOR SELECT TO authenticated
  USING (((is_active_snapshot = true) OR (SELECT public.is_super_admin(auth.uid())))
    AND ((SELECT public.current_access_unrestricted())
      OR coalesce(plant, '') = ANY ((SELECT public.current_access_plants())::text[])
      OR coalesce(profit_ctr, '') = ANY ((SELECT public.current_access_profit_centers())::text[])));
DROP POLICY IF EXISTS open_sales_orders_authorized_read ON public.open_sales_orders;
CREATE POLICY open_sales_orders_authorized_read ON public.open_sales_orders FOR SELECT TO authenticated
  USING ((is_active_snapshot = true) AND (SELECT public.has_screen(auth.uid(), 'sd.open-sales-orders'))
    AND ((SELECT public.current_access_unrestricted())
      OR coalesce(plant, '') = ANY ((SELECT public.current_access_plants())::text[])
      OR coalesce(profit_center, '') = ANY ((SELECT public.current_access_profit_centers())::text[])));
DROP POLICY IF EXISTS zcash_flow_authorized_read ON public.zcash_flow;
CREATE POLICY zcash_flow_authorized_read ON public.zcash_flow FOR SELECT TO authenticated
  USING ((SELECT public.has_screen(auth.uid(), 'fi.cash-flow'))
    AND ((SELECT public.current_access_unrestricted())
      OR coalesce(plant, '') = ANY ((SELECT public.current_access_plants())::text[])
      OR coalesce(profit_center, '') = ANY ((SELECT public.current_access_profit_centers())::text[])));
CREATE INDEX IF NOT EXISTS zfisales_detail_active_updated_idx
  ON public.zfisales_detail (is_active_snapshot, updated_at DESC);