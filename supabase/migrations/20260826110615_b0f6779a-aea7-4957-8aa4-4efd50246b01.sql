-- 1. Roles
CREATE TABLE public.roles (
  key text PRIMARY KEY,
  name text NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roles TO authenticated;
GRANT ALL ON public.roles TO service_role;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- 2. Role -> screen permissions
CREATE TABLE public.role_screens (
  role_key text NOT NULL REFERENCES public.roles(key) ON DELETE CASCADE,
  screen_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_key, screen_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_screens TO authenticated;
GRANT ALL ON public.role_screens TO service_role;
ALTER TABLE public.role_screens ENABLE ROW LEVEL SECURITY;

-- 3. User -> role assignments
CREATE TABLE public.user_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_key text NOT NULL REFERENCES public.roles(key) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_role_assignments TO authenticated;
GRANT ALL ON public.user_role_assignments TO service_role;
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;

-- 4. Profile fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS contact text,
  ADD COLUMN IF NOT EXISTS employee_id text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx
  ON public.profiles (lower(username)) WHERE username IS NOT NULL;

-- 5. Seed roles
INSERT INTO public.roles (key, name, description, is_system, sort_order) VALUES
  ('super_admin', 'Sharvi Admin', 'Full access to every screen, module, user, role and permission.', true, 0),
  ('admin', 'Admin', 'Administrator with access limited to the screens assigned below.', false, 10),
  ('buyer', 'Buyer', 'Purchasing and supplier analytics.', false, 20),
  ('approver', 'Approver', 'Workflow and approval analytics.', false, 30),
  ('viewer', 'Viewer', 'Read-only reporting access.', false, 40)
ON CONFLICT (key) DO NOTHING;

-- 6. Seed screen permissions
INSERT INTO public.role_screens (role_key, screen_key)
SELECT r.key, s.screen_key
FROM (VALUES
  ('super_admin','launchpad'),('super_admin','reports.procurement'),('super_admin','reports.purchase-orders'),
  ('super_admin','reports.suppliers'),('super_admin','reports.sales-analytics'),
  ('super_admin','module.sd'),('super_admin','module.fi'),('super_admin','module.co'),
  ('super_admin','module.pp'),('super_admin','module.qm'),('super_admin','module.ps'),
  ('super_admin','admin.users'),('super_admin','admin.roles'),('super_admin','admin.permissions'),
  ('admin','launchpad'),('admin','reports.procurement'),('admin','reports.purchase-orders'),
  ('admin','reports.suppliers'),('admin','reports.sales-analytics'),
  ('admin','module.sd'),('admin','module.fi'),('admin','module.co'),
  ('admin','module.pp'),('admin','module.qm'),('admin','module.ps'),
  ('admin','admin.users'),
  ('buyer','launchpad'),('buyer','reports.procurement'),('buyer','reports.purchase-orders'),
  ('buyer','reports.suppliers'),('buyer','reports.sales-analytics'),
  ('buyer','module.sd'),('buyer','module.pp'),('buyer','module.qm'),
  ('approver','launchpad'),('approver','reports.procurement'),('approver','reports.purchase-orders'),
  ('approver','module.fi'),('approver','module.co'),('approver','module.ps'),
  ('viewer','launchpad'),('viewer','reports.purchase-orders'),('viewer','reports.suppliers'),
  ('viewer','reports.sales-analytics'),
  ('viewer','module.sd'),('viewer','module.fi'),('viewer','module.qm'),('viewer','module.ps')
) AS s(role_key, screen_key)
JOIN public.roles r ON r.key = s.role_key
ON CONFLICT DO NOTHING;

-- 7. Carry over existing assignments
INSERT INTO public.user_role_assignments (user_id, role_key)
SELECT ur.user_id, ur.role::text FROM public.user_roles ur
ON CONFLICT DO NOTHING;

-- First existing admin also becomes super admin so the portal stays manageable
INSERT INTO public.user_role_assignments (user_id, role_key)
SELECT ur.user_id, 'super_admin' FROM public.user_roles ur WHERE ur.role = 'admin'::public.app_role
ON CONFLICT DO NOTHING;

-- 8. Helper functions
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_role_assignments
    WHERE user_id = _user_id AND role_key = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_screen(_user_id uuid, _screen text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_super_admin(_user_id) OR EXISTS (
    SELECT 1
    FROM public.user_role_assignments ura
    JOIN public.role_screens rs ON rs.role_key = ura.role_key
    WHERE ura.user_id = _user_id AND rs.screen_key = _screen
  );
$$;

-- Resolves a username OR email to the login email. Returns NULL for unknown or
-- inactive accounts. Exposes nothing beyond the address the caller already typed
-- when they typed an email.
CREATE OR REPLACE FUNCTION public.resolve_login_email(_identifier text)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  found_email text;
BEGIN
  IF _identifier IS NULL OR length(trim(_identifier)) = 0 THEN
    RETURN NULL;
  END IF;

  IF position('@' IN _identifier) > 0 THEN
    SELECT u.email INTO found_email
    FROM auth.users u
    JOIN public.profiles p ON p.id = u.id
    WHERE lower(u.email) = lower(trim(_identifier)) AND p.status = 'active';
    RETURN found_email;
  END IF;

  SELECT u.email INTO found_email
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE lower(p.username) = lower(trim(_identifier)) AND p.status = 'active';
  RETURN found_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_login_email(text) TO anon, authenticated;

-- 9. RLS policies
CREATE POLICY roles_read ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY roles_super_admin_write ON public.roles FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY role_screens_read ON public.role_screens FOR SELECT TO authenticated USING (true);
CREATE POLICY role_screens_super_admin_write ON public.role_screens FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY ura_read ON public.user_role_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY ura_super_admin_write ON public.user_role_assignments FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY profiles_super_admin_update ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- 10. updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_roles_updated_at ON public.roles;
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. New signups: first user becomes super admin, others viewer
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_first boolean;
BEGIN
  INSERT INTO public.profiles (id, display_name, company, avatar_url, username, first_name, last_name, contact, employee_id, department, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'company',
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'username',
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'contact',
    NEW.raw_user_meta_data ->> 'employee_id',
    NEW.raw_user_meta_data ->> 'department',
    COALESCE(NEW.raw_user_meta_data ->> 'status', 'active')
  )
  ON CONFLICT (id) DO NOTHING;

  SELECT NOT EXISTS (SELECT 1 FROM public.user_role_assignments) INTO is_first;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN is_first THEN 'admin'::public.app_role ELSE 'viewer'::public.app_role END)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.user_role_assignments (user_id, role_key)
  VALUES (NEW.id, CASE WHEN is_first THEN 'super_admin' ELSE 'viewer' END)
  ON CONFLICT (user_id, role_key) DO NOTHING;

  RETURN NEW;
END;
$$;