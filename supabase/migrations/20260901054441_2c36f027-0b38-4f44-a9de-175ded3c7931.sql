-- Grant every launchpad tile group screen to roles that could previously see those tiles
-- via the legacy tiles.allowed_roles list (non-module groups only).
INSERT INTO public.role_screens (role_key, screen_key)
SELECT DISTINCT r.key, 'group.' || t.group_key
FROM public.roles r
JOIN public.tiles t ON r.key::text = ANY (SELECT unnest(t.allowed_roles)::text)
WHERE r.key <> 'super_admin'
  AND t.group_key NOT IN ('sales-distribution','financial-accounting','controlling','production-planning','quality-management','project-systems')
ON CONFLICT DO NOTHING;

-- The admin role keeps full launchpad visibility for every non-module group.
INSERT INTO public.role_screens (role_key, screen_key)
SELECT 'admin', 'group.' || g.key
FROM public.tile_groups g
WHERE EXISTS (SELECT 1 FROM public.roles WHERE key = 'admin')
  AND g.key NOT IN ('sales-distribution','financial-accounting','controlling','production-planning','quality-management','project-systems')
ON CONFLICT DO NOTHING;