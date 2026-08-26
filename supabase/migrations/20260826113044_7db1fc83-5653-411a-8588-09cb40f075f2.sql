CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.admin_set_user_password(_user_id uuid, _new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden: Sharvi Admin role required';
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

REVOKE ALL ON FUNCTION public.admin_set_user_password(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_password(uuid, text) TO authenticated;