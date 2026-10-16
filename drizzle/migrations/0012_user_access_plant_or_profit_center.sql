CREATE OR REPLACE FUNCTION public.user_can_see(_plant text, _profit_center text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_data_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        (cardinality(p.plants) = 0 AND cardinality(p.profit_centers) = 0)
        OR coalesce(_plant, '') = ANY (p.plants)
        OR coalesce(_profit_center, '') = ANY (p.profit_centers)
      )
  );
$$;
NOTIFY pgrst, 'reload schema';