# Kong: `basic-auth` plugin not enabled (repo bug) + auth/rest/storage restarting

The Kong log names the cause exactly:

```
plugin 'basic-auth' not enabled; add it to the 'plugins' configuration property
in 'consumers': in 'basicauth_credentials': unknown field
```

`kong.yml` uses the `basic-auth` plugin for the Studio dashboard route, but the
compose file's `KONG_PLUGINS` list does not include it, so Kong refuses to load
the config and crash-loops. This is a bug in our repo files, not in your server
setup — `kong.yml` itself is fine (`file` confirms it is UTF-8 text).

## Repo change

In both `deploy/docker/docker-compose.production.yml` and
`deploy/docker/docker-compose.quality.yml`, change the Kong plugin list:

```yaml
KONG_PLUGINS: request-transformer,cors,key-auth,acl,basic-auth
```

That is the only edit needed to fix Kong.

## On the server

```bash
cd /opt/MIS_Projects/Production/backend
# upload the updated docker-compose.production.yml over the old one
docker compose --env-file .env -f docker-compose.production.yml up -d --force-recreate kong
sleep 10
docker logs mis_p_kong --tail 20        # no init_by_lua error
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:9010/rest/v1/
```

Optional: convert the file's CRLF line endings to LF (`sed -i 's/\r$//'
supabase/kong.yml`). Kong parsed it fine, so this is cosmetic.

## Second problem — auth, rest and storage are also restarting

Those three are the services that connect to Postgres with role-specific
passwords, and Quality failed the same way with
`password authentication failed for user "authenticator"`. Their cause here is
not yet confirmed, so read the logs before changing anything:

```bash
docker logs mis_p_auth --tail 20
docker logs mis_p_rest --tail 20
docker logs mis_p_storage --tail 20
docker logs mis_p_migrate --tail 20
```

- If they say `password authentication failed`, the Postgres volume was
  initialised with a different `POSTGRES_PASSWORD` than the one now in `.env`.
  Since Production has no real data yet, the fix is a clean reset:

  ```bash
  docker compose --env-file .env -f docker-compose.production.yml down -v
  docker compose --env-file .env -f docker-compose.production.yml up -d
  ```

  `down -v` deletes the database volume — only safe because this environment is
  brand new.

- If `mis_p_migrate` printed `ls: cannot access '/migrations/*.sql'`, the SQL
  files are missing from `/opt/MIS_Projects/Production/supabase/migrations/`
  and no tables exist; copy them there before restarting.

Paste those four logs and I will confirm which branch applies.

## Final verification

```bash
docker compose --env-file .env -f docker-compose.production.yml ps   # all Up, none Restarting
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:9010/rest/v1/   # 200 or 401
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1/supabase/rest/v1/
```

No application code changes.
