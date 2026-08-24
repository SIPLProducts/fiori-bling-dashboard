# Explain edge functions in the deployment runbook

Update the MIS deployment runbook so it clearly explains why this project has no Supabase Edge Functions and what replaces them.

## Background

The repository has no `supabase/functions/` directory and no Edge Function logic. All backend behaviour is implemented with TanStack server functions (`createServerFn`) that live inside the application source and are bundled with the frontend build. The only database/SQL artefacts that must be applied per environment are the migrations in `supabase/migrations/`.

## Changes to make

1. **Add a dedicated "Server architecture" section near the start of the runbook** that states:
   - This is a single full-stack TanStack Start application.
   - Backend logic is served by the same app process as the UI, using `createServerFn` RPC calls.
   - No Supabase Edge Functions are present or required.
   - The only backend SQL artefact to deploy is `supabase/migrations/*.sql`.

2. **Remove any remaining Edge Function references** from the Markdown runbook and the PDF:
   - No Edge Function build step.
   - No Edge Function deploy command.
   - No Edge Function environment variables.

3. **Keep the rest of the runbook intact** — server provisioning, Docker stacks, `.env` templates, Nginx configs, backups, troubleshooting, and the port matrix.

## Deliverables

- `MIS-Deployment-Runbook-v2.md` with the updated server-architecture explanation.
- `MIS-Deployment-Runbook-v2.pdf` regenerated from the updated Markdown.

No application code changes.
