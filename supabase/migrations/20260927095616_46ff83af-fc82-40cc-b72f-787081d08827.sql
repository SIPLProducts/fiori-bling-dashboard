GRANT INSERT, UPDATE, DELETE ON public.ztbn TO authenticated;
CREATE POLICY ztbn_super_admin_write ON public.ztbn
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));