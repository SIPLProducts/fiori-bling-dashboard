ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plants text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profit_centers text[] NOT NULL DEFAULT '{}';

UPDATE public.profiles SET plants = ARRAY[trim(plant)]
  WHERE coalesce(trim(plant), '') <> '' AND plants = '{}';
UPDATE public.profiles SET profit_centers = ARRAY[trim(profit_center)]
  WHERE coalesce(trim(profit_center), '') <> '' AND profit_centers = '{}';

COMMENT ON COLUMN public.profiles.plant IS 'DEPRECATED: replaced by plants (first value mirrored)';
COMMENT ON COLUMN public.profiles.profit_center IS 'DEPRECATED: replaced by profit_centers (first value mirrored)';

CREATE OR REPLACE FUNCTION public.is_data_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_role_assignments
    WHERE user_id = _user_id AND role_key IN ('super_admin', 'admin')
  );
$$;

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

CREATE OR REPLACE FUNCTION public.guard_profile_access_lists()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (NEW.plants IS DISTINCT FROM OLD.plants OR NEW.profit_centers IS DISTINCT FROM OLD.profit_centers)
     AND auth.uid() IS NOT NULL
     AND NOT public.has_screen(auth.uid(), 'admin.users')
     AND NOT public.is_data_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not allowed to change plant or profit centre access';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS profiles_guard_access_lists ON public.profiles;
CREATE TRIGGER profiles_guard_access_lists BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_access_lists();

-- Per-query access lookups: wrapped in (SELECT ...) inside policies so Postgres evaluates them once per query, not per row.
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

CREATE OR REPLACE FUNCTION public.net_sales_summary()
RETURNS TABLE(total numeric, sales_type text, type_total numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(sum(d.amount), 0)::numeric,
    COALESCE(NULLIF(trim(d.sales_type), ''), 'Other'),
    COALESCE(sum(d.amount), 0)::numeric
  FROM public.zfisales_detail d
  WHERE d.is_active_snapshot = true AND public.user_can_see(d.plant, d.profit_ctr)
  GROUP BY 2;
$$;

CREATE OR REPLACE FUNCTION public.net_sales_summary(_posting_from date, _posting_to date)
RETURNS TABLE(total numeric, sales_type text, type_total numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(sum(d.amount), 0)::numeric,
    COALESCE(NULLIF(trim(d.sales_type), ''), 'Other'),
    COALESCE(sum(d.amount), 0)::numeric
  FROM public.zfisales_detail d
  WHERE d.is_active_snapshot = true
    AND d.posting_date >= _posting_from AND d.posting_date <= _posting_to
    AND public.user_can_see(d.plant, d.profit_ctr)
  GROUP BY 2;
$$;

GRANT EXECUTE ON FUNCTION public.user_can_see(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_data_admin(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';