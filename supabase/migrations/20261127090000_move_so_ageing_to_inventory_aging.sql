INSERT INTO public.role_screens (role_key, screen_key)
SELECT DISTINCT role_key, 'inv.inventory-aging' FROM public.role_screens WHERE screen_key = 'sd.so-ageing'
ON CONFLICT DO NOTHING;
DROP POLICY IF EXISTS "SO ageing visible by access" ON public.so_ageing;
CREATE POLICY "SO ageing visible by access" ON public.so_ageing FOR SELECT TO authenticated USING (
  ((SELECT public.has_screen(auth.uid(), 'inv.inventory-aging')) OR (SELECT public.has_screen(auth.uid(), 'sd.so-ageing')))
  AND ((SELECT public.current_access_unrestricted())
    OR COALESCE(werks,'') = ANY ((SELECT public.current_access_plants())::text[])
    OR COALESCE(prctr,'') = ANY ((SELECT public.current_access_profit_centers())::text[])));
UPDATE public.sap_endpoints SET name = 'Inventory_Aging' WHERE name = 'SO_Ageing'
  AND NOT EXISTS (SELECT 1 FROM public.sap_endpoints WHERE name = 'Inventory_Aging');
DELETE FROM public.tiles WHERE screen_key = 'sd.so-ageing';