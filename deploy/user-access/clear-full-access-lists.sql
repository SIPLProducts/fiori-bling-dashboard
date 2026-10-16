-- A user with every plant (or every profit centre) ticked means "All" for that list.
UPDATE public.profiles p SET profit_centers = '{}'
WHERE cardinality(p.profit_centers) > 0
  AND NOT EXISTS (SELECT 1 FROM public.sap_user_dropdown_masters m
                  WHERE m.category = 'profit_center' AND NOT (m.code = ANY (p.profit_centers)));
UPDATE public.profiles p SET plants = '{}'
WHERE cardinality(p.plants) > 0
  AND NOT EXISTS (SELECT 1 FROM public.sap_user_dropdown_masters m
                  WHERE m.category = 'plant' AND NOT (m.code = ANY (p.plants)));
