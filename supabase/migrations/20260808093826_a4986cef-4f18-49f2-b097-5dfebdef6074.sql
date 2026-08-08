-- Procurement (MM) groups
UPDATE public.tiles SET allowed_roles = ARRAY['admin','buyer','approver','viewer']::app_role[] WHERE group_key IN ('procurement-overview','purchase-order');
UPDATE public.tiles SET allowed_roles = ARRAY['admin','buyer','approver']::app_role[] WHERE group_key = 'purchase-requisition';
UPDATE public.tiles SET allowed_roles = ARRAY['admin','buyer','viewer']::app_role[] WHERE group_key = 'supplier-evaluation';
UPDATE public.tiles SET allowed_roles = ARRAY['admin','buyer']::app_role[] WHERE group_key = 'purchase-contract';
UPDATE public.tiles SET allowed_roles = ARRAY['admin','approver']::app_role[] WHERE group_key = 'workflow';

-- Extended SAP modules
UPDATE public.tiles SET allowed_roles = ARRAY['admin','buyer','viewer']::app_role[] WHERE group_key = 'sales-distribution';
UPDATE public.tiles SET allowed_roles = ARRAY['admin','approver','viewer']::app_role[] WHERE group_key = 'financial-accounting';
UPDATE public.tiles SET allowed_roles = ARRAY['admin','approver']::app_role[] WHERE group_key = 'controlling';
UPDATE public.tiles SET allowed_roles = ARRAY['admin','buyer']::app_role[] WHERE group_key = 'production-planning';
UPDATE public.tiles SET allowed_roles = ARRAY['admin','buyer','viewer']::app_role[] WHERE group_key = 'quality-management';
UPDATE public.tiles SET allowed_roles = ARRAY['admin','approver','viewer']::app_role[] WHERE group_key = 'project-systems';