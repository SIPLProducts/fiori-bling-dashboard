-- SO Ageing (ZAGEING1_NEW, POST /zageing1_new/ageing). Snapshot of stock ageing as of P_BUDAT; a successful non-empty reply replaces older rows.
CREATE TABLE IF NOT EXISTS public.so_ageing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  werks text NOT NULL DEFAULT '', lgort text NOT NULL DEFAULT '', matnr text NOT NULL DEFAULT '', charg text NOT NULL DEFAULT '',
  mblnr text NOT NULL DEFAULT '', mjahr text NOT NULL DEFAULT '',
  plant_name text, sname text, maktx text, meins text, prctr text, bldat date, key_date date,
  buck1 numeric, valu1 numeric, buck2 numeric, valu2 numeric, buck3 numeric, valu3 numeric, buck4 numeric, valu4 numeric,
  cl_stck numeric, price numeric,
  bkt1 integer, bkt2 integer, bkt3 integer,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_endpoint text,
  synced_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT so_ageing_line_key UNIQUE (werks, lgort, matnr, charg, mblnr, mjahr)
);
CREATE INDEX IF NOT EXISTS so_ageing_werks_idx ON public.so_ageing (werks);
GRANT SELECT ON public.so_ageing TO authenticated;
GRANT ALL ON public.so_ageing TO service_role;
ALTER TABLE public.so_ageing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "SO ageing visible by access" ON public.so_ageing;
CREATE POLICY "SO ageing visible by access" ON public.so_ageing FOR SELECT TO authenticated USING (
  (SELECT public.has_screen(auth.uid(), 'sd.so-ageing')) AND ((SELECT public.current_access_unrestricted())
    OR COALESCE(werks,'') = ANY ((SELECT public.current_access_plants())::text[])
    OR COALESCE(prctr,'') = ANY ((SELECT public.current_access_profit_centers())::text[])));
INSERT INTO public.sap_endpoints (name, module_key, description, endpoint_path, system_key, http_method, auth_type, body_template, posting_range, is_active)
SELECT 'SO_Ageing','common','ZAGEING1_NEW SO / Stock Ageing','/zageing1_new/ageing?sap-client=234','dev','POST','proxy',
  '{"P_BUDAT":"","WERKS_FROM":[],"WERKS_TO":[],"MATNR_FROM":[],"MATNR_TO":[],"MTART_FROM":[],"MTART_TO":[],"MATKL_FROM":[],"MATKL_TO":[],"LGORT_FROM":[],"LGORT_TO":[],"P2_BKT1":"0090","P2_BKT2":"0180","P2_BKT3":"0365"}','today',true
WHERE NOT EXISTS (SELECT 1 FROM public.sap_endpoints WHERE name='SO_Ageing');
INSERT INTO public.tiles (group_key, title, subtitle, icon, kind, kpi_key, target_path, allowed_roles, sort_order, screen_key)
SELECT 'sales-distribution', 'SO Ageing', 'Stock ageing by bucket', 'list', 'launch', 'sd_so_ageing', '/reports/sd/so-ageing', ARRAY['admin','buyer','approver','viewer']::public.app_role[], 20, 'sd.so-ageing'
WHERE NOT EXISTS (SELECT 1 FROM public.tiles WHERE screen_key = 'sd.so-ageing');
INSERT INTO public.role_screens (role_key, screen_key)
SELECT DISTINCT role_key, 'sd.so-ageing' FROM public.role_screens WHERE screen_key IN ('sd.dispatches')
ON CONFLICT DO NOTHING;
INSERT INTO public.role_screens (role_key, screen_key)
SELECT r.key, 'sd.so-ageing' FROM public.roles r WHERE r.key IN ('admin','super_admin')
ON CONFLICT DO NOTHING;
NOTIFY pgrst, 'reload schema';
