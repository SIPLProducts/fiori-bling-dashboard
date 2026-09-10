GRANT INSERT, UPDATE ON public.zfisales_detail TO authenticated;
GRANT ALL ON public.zfisales_detail TO service_role;

CREATE POLICY "zfisales_detail_super_admin_insert"
ON public.zfisales_detail
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "zfisales_detail_super_admin_update"
ON public.zfisales_detail
FOR UPDATE
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));