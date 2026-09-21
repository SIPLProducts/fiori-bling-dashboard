-- Apply to each self-hosted environment after deploying this portal update.
-- Deleting tile groups also removes their tiles through ON DELETE CASCADE.
DELETE FROM public.tile_groups
WHERE key IN (
  'procurement-overview',
  'purchase-order',
  'purchase-requisition',
  'supplier-evaluation',
  'purchase-contract',
  'workflow',
  'controlling',
  'quality-management',
  'project-systems'
);

DELETE FROM public.role_screens
WHERE screen_key IN (
  'group.procurement-overview',
  'group.purchase-order',
  'group.purchase-requisition',
  'group.supplier-evaluation',
  'group.purchase-contract',
  'group.workflow',
  'reports.procurement',
  'reports.purchase-orders',
  'reports.suppliers',
  'module.co',
  'module.qm',
  'module.ps'
);