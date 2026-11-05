DROP POLICY IF EXISTS "Purchase register visible by access" ON public.purchase_register;
CREATE POLICY "Purchase register visible by access" ON public.purchase_register FOR SELECT TO authenticated USING (
  (SELECT public.current_access_unrestricted()) OR COALESCE(werks,'') = ANY ((SELECT public.current_access_plants())::text[]) OR COALESCE(prctr,'') = ANY ((SELECT public.current_access_profit_centers())::text[]));
DROP POLICY IF EXISTS "SIT readable by screen access" ON public.sales_in_transit;
CREATE POLICY "SIT readable by screen access" ON public.sales_in_transit FOR SELECT TO authenticated USING (
  (SELECT public.current_access_unrestricted()) OR COALESCE(werks,'') = ANY ((SELECT public.current_access_plants())::text[]) OR COALESCE(prctr,'') = ANY ((SELECT public.current_access_profit_centers())::text[]));
DROP POLICY IF EXISTS "Sales Register readable by screen access" ON public.sales_register;
CREATE POLICY "Sales Register readable by screen access" ON public.sales_register FOR SELECT TO authenticated USING (
  (SELECT public.current_access_unrestricted()) OR COALESCE(werks,'') = ANY ((SELECT public.current_access_plants())::text[]) OR COALESCE(prctr,'') = ANY ((SELECT public.current_access_profit_centers())::text[]));
DROP POLICY IF EXISTS "Order book visible by plant or profit centre" ON public.order_book;
CREATE POLICY "Order book visible by plant or profit centre" ON public.order_book FOR SELECT TO authenticated USING (
  (SELECT public.current_access_unrestricted()) OR COALESCE(plant,'') = ANY ((SELECT public.current_access_plants())::text[]) OR COALESCE(profit_center,'') = ANY ((SELECT public.current_access_profit_centers())::text[]));
DROP POLICY IF EXISTS "Open purchase orders visible by access" ON public.open_purchase_order;
CREATE POLICY "Open purchase orders visible by access" ON public.open_purchase_order FOR SELECT TO authenticated USING (
  (SELECT public.has_screen(auth.uid(), 'mm.open-purchase-orders')) AND ((SELECT public.current_access_unrestricted()) OR COALESCE(werks,'') = ANY ((SELECT public.current_access_plants())::text[])));
DROP POLICY IF EXISTS "Purchase orders visible by access" ON public.purchase_orders;
CREATE POLICY "Purchase orders visible by access" ON public.purchase_orders FOR SELECT TO authenticated USING (
  (SELECT public.has_screen(auth.uid(), 'mm.purchase-orders')) AND ((SELECT public.current_access_unrestricted()) OR COALESCE(plant,'') = ANY ((SELECT public.current_access_plants())::text[])));