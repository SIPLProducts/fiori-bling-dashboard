# Production upgrade from the 24-Aug-2026 release

This upgrades the existing installation at `http://10.10.4.165:9000`. It does not recreate the server and never deletes Docker volumes.

## Production ports

| Service | Port |
| --- | ---: |
| Portal / Nginx | 9000 |
| SAP middleware / PM2 | 3010 |
| Existing backend | 5001 |
| Database API | 9010 |
| Studio | 9012 |
| PostgreSQL | 5433 |

Quality remains on its existing ports, including middleware `3002` and database API `8000`.

## Before running

1. Pull the latest Git branch on `10.10.4.165`.
2. Confirm Quality works and its middleware `.env` contains the working SAP password and shared secret.
3. Confirm Production backend `.env` contains its existing `ANON_KEY` and `SERVICE_ROLE_KEY`.
4. Keep at least enough free disk space for one complete Production database backup.

## Run the upgrade

From the latest repository root:

```bash
cd deploy
chmod +x production-upgrade-all.sh
sudo ./production-upgrade-all.sh --confirm-copy-quality
```

The confirmation flag is required because this replaces Production users, permissions, SAP settings, sync history, and `zfisales_detail` rows with the current Quality data.

The script performs these operations:

- backs up the current Production database, frontend, middleware, Nginx, and backend environment;
- applies only migration files dated after 24 August 2026 and records completed files;
- copies current Quality accounts with their existing password hashes and copies permissions, SAP settings, and sales rows;
- builds a Production-only frontend for `http://10.10.4.165:9000/supabase`;
- creates the previously missing Production middleware on port `3010`;
- installs its packages and generated sync bundle, then runs it as `mis-p-middleware`;
- upgrades Nginx in place with the secure `/sap-mw/` bridge;
- runs health checks and one manual `Sales_Reports_KPI` synchronization before enabling schedules.

Expected final output includes:

```text
PRODUCTION UPGRADE COMPLETE
Portal:  http://10.10.4.165:9000
```

Check afterward:

```bash
pm2 status
pm2 logs mis-p-middleware --lines 50 --nostream
curl http://127.0.0.1:9000/healthz
```

PM2 must show `mis-p-middleware` online. Its logs must show `listening on :3010` and `scheduler started`.

## Rollback

The script prints its timestamped backup directory under:

```text
/opt/MIS_Projects/Production/backups/upgrade-YYYYMMDD-HHMMSS
```

Stop Production middleware before restoring:

```bash
pm2 stop mis-p-middleware
```

Restore the database only when a rollback is required:

```bash
gunzip -c /opt/MIS_Projects/Production/backups/upgrade-<timestamp>/production-before.sql.gz \
  | docker exec -i mis_p_db psql -U supabase_admin -d postgres
```

Restore the saved Nginx file, test it, and reload:

```bash
sudo cp /opt/MIS_Projects/Production/backups/upgrade-<timestamp>/nginx.conf \
  /etc/nginx/sites-available/mis-production.conf
sudo nginx -t && sudo systemctl reload nginx
```

Never run `docker compose down -v`; that deletes Production data.

## Common failures

- **Middleware shows port 3000:** remove the old PM2 process and rerun the script. It starts PM2 with inherited `PORT` removed.
- **Invalid authentication credentials:** Production middleware must use the exact `SERVICE_ROLE_KEY` from `Production/backend/.env`, with one line and no extra spaces.
- **502 on `/sap-mw/`:** check `pm2 status`, verify port `3010`, and confirm Nginx has the same shared secret as the middleware `.env`.
- **SAP returns no data:** confirm the endpoint date range and SAP selection values. The rolling range recalculates on every run.
- **Large SAP response:** the included scheduler uses 40-key duplicate lookups and 500-row writes, supporting 30,000+ rows without oversized URLs.