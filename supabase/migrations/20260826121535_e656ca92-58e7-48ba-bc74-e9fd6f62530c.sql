CREATE TABLE public.sap_systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  environment text NOT NULL DEFAULT 'DEV',
  base_url text NOT NULL DEFAULT '',
  sap_client text,
  username text,
  is_active boolean NOT NULL DEFAULT false,
  last_test_status text,
  last_test_message text,
  last_test_at timestamptz,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sap_systems TO authenticated;
GRANT ALL ON public.sap_systems TO service_role;
ALTER TABLE public.sap_systems ENABLE ROW LEVEL SECURITY;
CREATE POLICY sap_systems_super_admin_all ON public.sap_systems FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TABLE public.sap_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  module_key text NOT NULL DEFAULT 'common',
  description text,
  endpoint_path text NOT NULL DEFAULT '',
  system_key text,
  http_method text NOT NULL DEFAULT 'GET',
  auth_type text NOT NULL DEFAULT 'basic',
  query_params jsonb NOT NULL DEFAULT '[]'::jsonb,
  headers jsonb NOT NULL DEFAULT '[]'::jsonb,
  body_template text,
  response_root text,
  response_notes text,
  sample_response text,
  scheduler_enabled boolean NOT NULL DEFAULT false,
  schedule_expression text,
  last_run_at timestamptz,
  last_run_status text,
  is_active boolean NOT NULL DEFAULT true,
  last_test_status text,
  last_test_message text,
  last_test_duration_ms integer,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sap_endpoints TO authenticated;
GRANT ALL ON public.sap_endpoints TO service_role;
ALTER TABLE public.sap_endpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY sap_endpoints_super_admin_all ON public.sap_endpoints FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TABLE public.sap_middleware_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  connection_mode text NOT NULL DEFAULT 'proxy',
  deployment_mode text NOT NULL DEFAULT 'self_hosted',
  middleware_port integer NOT NULL DEFAULT 3008,
  middleware_url text NOT NULL DEFAULT '',
  last_test_status text,
  last_test_message text,
  last_test_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sap_middleware_config TO authenticated;
GRANT ALL ON public.sap_middleware_config TO service_role;
ALTER TABLE public.sap_middleware_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY sap_middleware_super_admin_all ON public.sap_middleware_config FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER update_sap_systems_updated_at BEFORE UPDATE ON public.sap_systems
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sap_endpoints_updated_at BEFORE UPDATE ON public.sap_endpoints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sap_middleware_updated_at BEFORE UPDATE ON public.sap_middleware_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.sap_middleware_config (singleton) VALUES (true);
INSERT INTO public.sap_systems (key, label, environment, base_url, sap_client, username, is_active, sort_order)
VALUES ('dev', 'SAP DEV', 'DEV', 'http://10.200.1.2:8000', '100', 'sipl_dev', true, 10);
INSERT INTO public.role_screens (role_key, screen_key)
SELECT 'super_admin', 'admin.sap-api'
WHERE EXISTS (SELECT 1 FROM public.roles WHERE key = 'super_admin')
ON CONFLICT DO NOTHING;