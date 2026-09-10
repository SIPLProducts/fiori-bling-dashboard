# Why the two counts differ, and refreshing the Quality server

## What the numbers mean

- The web app screenshot shows 33,504 posting lines. The database the app reads really does hold **33,504 rows** (last updated 10-Sep 14:45 IST). The app is correct.
- The table editor screenshot at 10.10.4.165:8000 is the **Quality server's own database**, which still holds the 33,174-row snapshot imported from the CSV. It has never run its own SAP sync, so it stays at the import figure.
- The extra 330 lines came from the live SAP syncs running every 5 minutes (405 records per run, mostly refreshes of existing lines plus a few new ones).
- Separately, the Quality table editor count can lag until Refresh is pressed, so always confirm there with a count query.

No application bug, and no code change is needed.

## What I will do: refresh Quality with a new export

1. Export the current full sales table (all 33,504 lines, every column) to `deploy/zfisales_detail.csv.gz`, replacing the older 33,174-line export.
2. Update `deploy/README.md` with the new row count and the exact import command.
3. Hand you the file to copy to the Quality server.

## On the server

```bash
cd /opt/MIS_Projects/Quality/deploy
set -a; source /opt/MIS_Projects/Quality/backend/.env; set +a

docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i mis_q_db \
  psql -U supabase_admin -d postgres -c "TRUNCATE public.zfisales_detail;"

zcat zfisales_detail.csv.gz | docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i mis_q_db \
  psql -U supabase_admin -d postgres \
  -c "COPY public.zfisales_detail FROM STDIN WITH (FORMAT csv, HEADER true);"

docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i mis_q_db \
  psql -U supabase_admin -d postgres \
  -c "select count(*), round(sum(amount)/10000000,2) as total_cr from public.zfisales_detail;"
```

Expect **33,504** rows. Do not rerun `quality-setup-all.sh` for this — it would also recreate users and reseed SAP settings.

## Note

Quality keeps drifting behind while the live system syncs every 5 minutes. Once the Quality middleware and scheduler are running against SAP, it will top itself up and these manual exports stop being needed.
