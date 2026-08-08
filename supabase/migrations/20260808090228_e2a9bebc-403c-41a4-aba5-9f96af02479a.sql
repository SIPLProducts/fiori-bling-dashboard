CREATE TYPE public.app_role AS ENUM ('admin','buyer','approver','viewer');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  company text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "user_roles_select_authenticated" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_roles_admin_write" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_first boolean;
BEGIN
  INSERT INTO public.profiles (id, display_name, company, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'company',
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO is_first;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN is_first THEN 'admin'::public.app_role ELSE 'viewer'::public.app_role END)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.tile_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  title text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tile_groups TO authenticated;
GRANT ALL ON public.tile_groups TO service_role;
ALTER TABLE public.tile_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tile_groups_read" ON public.tile_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "tile_groups_admin_write" ON public.tile_groups FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.tiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_key text NOT NULL REFERENCES public.tile_groups(key) ON DELETE CASCADE,
  title text NOT NULL,
  subtitle text,
  icon text NOT NULL DEFAULT 'grid',
  kind text NOT NULL DEFAULT 'launch',
  kpi_key text,
  target_path text,
  allowed_roles public.app_role[] NOT NULL DEFAULT ARRAY['admin','buyer','approver','viewer']::public.app_role[],
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tiles TO authenticated;
GRANT ALL ON public.tiles TO service_role;
ALTER TABLE public.tiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tiles_read" ON public.tiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "tiles_admin_write" ON public.tiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.tile_groups (key, title, sort_order) VALUES
  ('purchase-requisition','Purchase Requisition Processing',1),
  ('supplier-evaluation','Supplier Evaluation',2),
  ('procurement-overview','Procurement Overview',3),
  ('workflow','Workflow',4),
  ('purchase-order','Purchase Order Processing',5),
  ('purchase-contract','Purchase Contract Processing',6);

INSERT INTO public.tiles (group_key, title, subtitle, icon, kind, kpi_key, target_path, allowed_roles, sort_order) VALUES
  ('procurement-overview','Procurement Overview','Spend analytics','pie','launch',NULL,'/reports/procurement',ARRAY['admin','buyer','approver','viewer']::public.app_role[],1),
  ('procurement-overview','Total Spend','Year to date','currency','kpi','total_spend','/reports/procurement',ARRAY['admin','buyer','approver']::public.app_role[],2),
  ('procurement-overview','Spend Trend','Last 12 months','trend','chart','spend_trend','/reports/procurement',ARRAY['admin','buyer','approver']::public.app_role[],3),
  ('procurement-overview','Savings Realized','Against baseline','savings','kpi','savings','/reports/procurement',ARRAY['admin','buyer']::public.app_role[],4),

  ('purchase-order','Manage Purchase Orders','Analytics view','doc','launch',NULL,'/reports/purchase-orders',ARRAY['admin','buyer','approver','viewer']::public.app_role[],1),
  ('purchase-order','Monitor Purchase Order Items','Overdue','doc','kpi','po_overdue','/reports/purchase-orders',ARRAY['admin','buyer','approver']::public.app_role[],2),
  ('purchase-order','Monitor Supplier Confirmations','Pending Confirmations','users','kpi','pending_confirmations','/reports/purchase-orders',ARRAY['admin','buyer','approver']::public.app_role[],3),
  ('purchase-order','My Purchasing Document Items',NULL,'list','launch',NULL,'/reports/purchase-orders',ARRAY['admin','buyer','approver','viewer']::public.app_role[],4),
  ('purchase-order','Purchase Order Value Trend','Rolling 12 months','trend','chart','po_value_trend','/reports/purchase-orders',ARRAY['admin','buyer']::public.app_role[],5),
  ('purchase-order','Display Purchasing Documents by Supplier',NULL,'grid','launch',NULL,'/reports/suppliers',ARRAY['admin','buyer','approver','viewer']::public.app_role[],6),

  ('supplier-evaluation','Supplier Scorecards','Quality, delivery, price','users','launch',NULL,'/reports/suppliers',ARRAY['admin','buyer','approver','viewer']::public.app_role[],1),
  ('supplier-evaluation','Average Supplier Score','All active suppliers','star','kpi','avg_supplier_score','/reports/suppliers',ARRAY['admin','buyer','approver']::public.app_role[],2),
  ('supplier-evaluation','On-Time Delivery','Last 90 days','clock','kpi','on_time_delivery','/reports/suppliers',ARRAY['admin','buyer','approver']::public.app_role[],3),
  ('supplier-evaluation','Suppliers at Risk','Score below 60','alert','kpi','suppliers_at_risk','/reports/suppliers',ARRAY['admin','buyer']::public.app_role[],4),

  ('purchase-requisition','Open Requisitions','Awaiting conversion','cart','kpi','open_requisitions','/reports/purchase-orders',ARRAY['admin','buyer','approver']::public.app_role[],1),
  ('purchase-requisition','Requisition Value','Open value','currency','kpi','requisition_value','/reports/purchase-orders',ARRAY['admin','buyer']::public.app_role[],2),
  ('purchase-requisition','Display Purch. Docs by Account Assignment',NULL,'grid','launch',NULL,'/reports/purchase-orders',ARRAY['admin','buyer','approver','viewer']::public.app_role[],3),

  ('workflow','Pending Approvals','Assigned to me','check','kpi','pending_approvals','/reports/purchase-orders',ARRAY['admin','approver']::public.app_role[],1),
  ('workflow','Average Approval Time','Days','clock','kpi','avg_approval_time','/reports/purchase-orders',ARRAY['admin','approver','buyer']::public.app_role[],2),
  ('workflow','My Inbox',NULL,'list','launch',NULL,'/reports/purchase-orders',ARRAY['admin','approver','buyer','viewer']::public.app_role[],3),

  ('purchase-contract','Active Contracts','Currently valid','doc','kpi','active_contracts','/reports/suppliers',ARRAY['admin','buyer','approver']::public.app_role[],1),
  ('purchase-contract','Contracts Expiring','Next 90 days','alert','kpi','contracts_expiring','/reports/suppliers',ARRAY['admin','buyer']::public.app_role[],2),
  ('purchase-contract','Manage Purchase Contract Items',NULL,'list','launch',NULL,'/reports/suppliers',ARRAY['admin','buyer','approver','viewer']::public.app_role[],3);