-- Allow screen-permission based administration (Sharvi Admin still implicitly allowed via has_screen)

-- profiles: update by user managers
DROP POLICY IF EXISTS profiles_super_admin_update ON public.profiles;
CREATE POLICY profiles_admin_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_screen(auth.uid(), 'admin.users'))
  WITH CHECK (public.has_screen(auth.uid(), 'admin.users'));

-- roles: managed by users with the Roles screen
DROP POLICY IF EXISTS roles_super_admin_write ON public.roles;
CREATE POLICY roles_admin_write ON public.roles
  FOR ALL TO authenticated
  USING (public.has_screen(auth.uid(), 'admin.roles'))
  WITH CHECK (public.has_screen(auth.uid(), 'admin.roles'));

-- role_screens: managed by users with the Screen Permissions screen
DROP POLICY IF EXISTS role_screens_super_admin_write ON public.role_screens;
CREATE POLICY role_screens_admin_write ON public.role_screens
  FOR ALL TO authenticated
  USING (public.has_screen(auth.uid(), 'admin.permissions'))
  WITH CHECK (public.has_screen(auth.uid(), 'admin.permissions'));

-- user_role_assignments: managed by user managers, but only Sharvi Admin may grant Sharvi Admin
DROP POLICY IF EXISTS ura_super_admin_write ON public.user_role_assignments;
CREATE POLICY ura_admin_write ON public.user_role_assignments
  FOR ALL TO authenticated
  USING (
    public.has_screen(auth.uid(), 'admin.users')
    AND (role_key <> 'super_admin' OR public.is_super_admin(auth.uid()))
  )
  WITH CHECK (
    public.has_screen(auth.uid(), 'admin.users')
    AND (role_key <> 'super_admin' OR public.is_super_admin(auth.uid()))
  );

-- confirming a new user's email is part of user management
CREATE OR REPLACE FUNCTION public.admin_confirm_user_email(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  IF NOT public.has_screen(auth.uid(), 'admin.users') THEN
    RAISE EXCEPTION 'Forbidden: User Management access required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
  WHERE id = _user_id;
END;
$function$;