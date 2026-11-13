CREATE TABLE IF NOT EXISTS public.month_wise_upload (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  year integer NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
CREATE INDEX IF NOT EXISTS month_wise_upload_period_idx ON public.month_wise_upload (year, month);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.month_wise_upload TO authenticated;
GRANT ALL ON public.month_wise_upload TO service_role;
ALTER TABLE public.month_wise_upload ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS month_wise_upload_all ON public.month_wise_upload;
CREATE POLICY month_wise_upload_all ON public.month_wise_upload FOR ALL TO authenticated
  USING (public.is_data_admin(auth.uid()) OR public.has_screen(auth.uid(), 'tables.month-wise-upload'))
  WITH CHECK (public.is_data_admin(auth.uid()) OR public.has_screen(auth.uid(), 'tables.month-wise-upload'));

INSERT INTO public.tiles (group_key, title, subtitle, icon, kind, kpi_key, target_path, allowed_roles, sort_order, screen_key)
SELECT 'tables-master', 'Month Wise Upload', 'Monthly Excel uploads', 'list', 'launch', 'table_month_wise_upload', '/reports/tables/month-wise-upload', ARRAY['admin','buyer','approver','viewer']::public.app_role[], 50, 'tables.month-wise-upload'
WHERE NOT EXISTS (SELECT 1 FROM public.tiles WHERE screen_key = 'tables.month-wise-upload');
