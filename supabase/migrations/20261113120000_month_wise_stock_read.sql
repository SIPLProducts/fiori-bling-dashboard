CREATE POLICY month_wise_upload_stock_read ON public.month_wise_upload FOR SELECT TO authenticated
USING (public.has_screen(auth.uid(), 'inv.month-wise-stock') AND public.user_can_see(data->>'Plnt', data->>'Profit Centre'));

DROP POLICY IF EXISTS sap_masters_read ON public.sap_masters;
CREATE POLICY sap_masters_read ON public.sap_masters FOR SELECT TO authenticated USING (
  public.is_data_admin(auth.uid())
  OR public.has_screen(auth.uid(), 'tables.' || replace(category, '_', '-'))
  OR (category = 'zrmmat' AND (public.has_screen(auth.uid(), 'mm.purchase-register') OR public.has_screen(auth.uid(), 'mm.purchase-orders') OR public.has_screen(auth.uid(), 'inv.month-wise-stock')))
  OR (category IN ('zpc_group', 'valuation_subgroup') AND public.has_screen(auth.uid(), 'inv.month-wise-stock'))
);
NOTIFY pgrst, 'reload schema';