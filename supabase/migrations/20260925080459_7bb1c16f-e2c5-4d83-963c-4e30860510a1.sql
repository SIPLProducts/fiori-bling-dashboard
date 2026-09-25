CREATE TABLE public.sales_revenue_targets (
  fiscal_year text PRIMARY KEY,
  target_amount numeric NOT NULL CHECK (target_amount > 0),
  updated_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_revenue_targets TO authenticated;
GRANT ALL ON public.sales_revenue_targets TO service_role;

ALTER TABLE public.sales_revenue_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sales revenue targets"
ON public.sales_revenue_targets
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Sharvi Admin can add sales revenue targets"
ON public.sales_revenue_targets
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()) AND updated_by = auth.uid());

CREATE POLICY "Sharvi Admin can change sales revenue targets"
ON public.sales_revenue_targets
FOR UPDATE
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()) AND updated_by = auth.uid());

CREATE POLICY "Sharvi Admin can remove sales revenue targets"
ON public.sales_revenue_targets
FOR DELETE
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE TRIGGER update_sales_revenue_targets_updated_at
BEFORE UPDATE ON public.sales_revenue_targets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();