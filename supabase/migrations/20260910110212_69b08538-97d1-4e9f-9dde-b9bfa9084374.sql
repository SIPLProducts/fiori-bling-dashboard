CREATE OR REPLACE FUNCTION public.admin_set_user_role(_user_id uuid, _role_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _caller uuid := auth.uid();
  _allowed boolean;
BEGIN
  _allowed := public.has_screen(_caller, 'admin.users');
  IF NOT _allowed THEN
    RAISE EXCEPTION 'Forbidden: User Management access required';
  END IF;

  IF _role_key IS NULL OR length(trim(_role_key)) = 0 THEN
    RAISE EXCEPTION 'A role is required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.roles WHERE key = _role_key) THEN
    RAISE EXCEPTION 'Unknown role: %', _role_key;
  END IF;

  IF _user_id = _caller AND public.is_super_admin(_caller) AND _role_key <> 'super_admin' THEN
    RAISE EXCEPTION 'You cannot remove your own Sharvi Admin role';
  END IF;

  DELETE FROM public.user_role_assignments WHERE user_id = _user_id;
  INSERT INTO public.user_role_assignments (user_id, role_key)
  VALUES (_user_id, _role_key)
  ON CONFLICT (user_id, role_key) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_user_password(_user_id uuid, _new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'auth'
AS $$
BEGIN
  IF NOT public.has_screen(auth.uid(), 'admin.users') THEN
    RAISE EXCEPTION 'Forbidden: User Management access required';
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
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_user(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
BEGIN
  IF NOT public.has_screen(auth.uid(), 'admin.users') THEN
    RAISE EXCEPTION 'Forbidden: User Management access required';
  END IF;

  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete your own account';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  DELETE FROM public.user_role_assignments WHERE user_id = _user_id;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  DELETE FROM public.profiles WHERE id = _user_id;
  DELETE FROM auth.users WHERE id = _user_id;
END;
$$;