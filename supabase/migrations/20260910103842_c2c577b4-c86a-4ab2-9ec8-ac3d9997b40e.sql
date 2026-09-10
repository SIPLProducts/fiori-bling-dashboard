CREATE OR REPLACE FUNCTION public.admin_set_user_password(_user_id uuid, _new_password text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'auth'
AS $function$
BEGIN
  IF NOT public.has_screen(auth.uid(), 'admin.users') THEN
    RAISE EXCEPTION 'Forbidden: User Management access required';
  END IF;

  IF public.is_super_admin(_user_id) AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only a Sharvi Admin can change a Sharvi Admin password';
  END IF;

  IF _new_password IS NULL OR length(_new_password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  UPDATE auth.users
  SET encrypted_password = extensions.crypt(_new_password, extensions.gen_salt('bf')),
      updated_at = now()
  WHERE id = _user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_delete_user(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  IF NOT public.has_screen(auth.uid(), 'admin.users') THEN
    RAISE EXCEPTION 'Forbidden: User Management access required';
  END IF;

  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete your own account';
  END IF;

  IF public.is_super_admin(_user_id) AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only a Sharvi Admin can delete a Sharvi Admin';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  DELETE FROM public.user_role_assignments WHERE user_id = _user_id;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  DELETE FROM public.profiles WHERE id = _user_id;
  DELETE FROM auth.users WHERE id = _user_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;

CREATE POLICY "profiles_admin_delete" ON public.profiles
  FOR DELETE TO authenticated
  USING (public.has_screen(auth.uid(), 'admin.users'));