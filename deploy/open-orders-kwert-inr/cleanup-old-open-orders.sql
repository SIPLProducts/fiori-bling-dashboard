-- DESTRUCTIVE: execute only after backup, migration, updated frontend and middleware.
-- Temporarily disable Open Orders scheduling; this deletes ONLY old Open Orders.
BEGIN;
DELETE FROM public.open_sales_orders WHERE id IS NOT NULL;
COMMIT;
