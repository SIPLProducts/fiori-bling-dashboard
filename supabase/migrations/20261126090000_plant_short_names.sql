-- Plant code -> short name lookup for detailed tables on every screen.
CREATE OR REPLACE FUNCTION public.plant_short_names()
RETURNS TABLE(code text, name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH dp AS (
    SELECT DISTINCT ON (trim(werks)) trim(werks) AS code, trim(plant_short_name) AS name
    FROM public.daily_production
    WHERE auth.uid() IS NOT NULL AND coalesce(trim(plant_short_name), '') <> '' AND coalesce(trim(werks), '') <> ''
    ORDER BY trim(werks), synced_at DESC
  ), m AS (
    SELECT trim(code) AS code, trim(name) AS name FROM public.sap_user_dropdown_masters
    WHERE auth.uid() IS NOT NULL AND category = 'plant' AND coalesce(trim(name), '') <> ''
  )
  SELECT code, name FROM dp
  UNION ALL
  SELECT m.code, m.name FROM m WHERE NOT EXISTS (SELECT 1 FROM dp WHERE dp.code = m.code);
$$;
REVOKE ALL ON FUNCTION public.plant_short_names() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.plant_short_names() TO authenticated;
