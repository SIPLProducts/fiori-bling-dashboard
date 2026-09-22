-- Idempotent launchpad cleanup for self-hosted Quality and Production.
-- Safe to run repeatedly after application migrations.
\ir remove-retired-screens.sql
\ir remove-sd-summary-cards.sql
\ir fix-open-sales-orders-route.sql
