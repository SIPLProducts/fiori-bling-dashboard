-- Run on Quality / Production. Every query should return rows; an empty result means
-- install-purchase-module.sql has not been run there.
SELECT key, title, sort_order FROM public.tile_groups WHERE key = 'purchase';
SELECT title, screen_key, target_path, allowed_roles FROM public.tiles WHERE group_key = 'purchase' ORDER BY sort_order;
SELECT role_key, screen_key FROM public.role_screens WHERE screen_key LIKE 'mm.%' OR screen_key = 'module.mm' ORDER BY 1, 2;
SELECT to_regclass('public.purchase_register') AS purchase_register_table;
SELECT name, path FROM public.sap_endpoints WHERE name = 'Purchase Register';
