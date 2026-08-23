# Static `dist/` build with `index.html`

Goal: `npm run build` produces a plain `dist/` folder containing `index.html` plus
the JS/CSS/asset files, which you upload to
`/opt/MIS_Projects/Quality/frontend/dist/` and Nginx serves directly — no Node app
container needed for the frontend.

## What this means

Today the portal is server-rendered, so the build emits a Node server bundle
(`.output/server`) instead of an `index.html`. To get a static `dist/index.html`
the app must switch to **SPA mode**: the browser downloads `index.html`, React
boots, and all data is fetched from your self-hosted Supabase through Kong.

## Changes

**1. Turn on SPA / static output**

`vite.config.ts`:

```ts
export default defineConfig({
  tanstackStart: {
    spa: { enabled: true },          // emits a static index.html shell
    prerender: { enabled: false },
  },
  nitro: { output: { dir: "dist" } },
});
```

Result:

```text
dist/
  index.html
  assets/…            JS, CSS, fonts, favicon
```

**2. Move the four server-function modules to browser-side Supabase calls**

These currently run on the server and would have no server to run on:

| File | New behaviour |
| ---- | ------------- |
| `src/lib/sap.functions.ts` | Read launchpad groups/tiles + report data via the browser Supabase client (RLS enforces role access). |
| `src/lib/zfisales.functions.ts` | Sales Analytics dataset served from a Supabase table/RPC, queried client-side with the same filters. |
| `src/lib/demo.functions.ts` | Demo login calls `signInWithPassword` directly; the demo user is created once by a migration instead of on demand. |
| `src/lib/admin.functions.ts` | User admin screen reads `profiles` / `user_roles` via RLS-protected queries. Any action that truly needs the service role is dropped from the static build. |

Access control stops being enforced by server code, so it must be enforced by
**RLS policies and the `has_role()` function** in the database. That is the main
trade-off of going static — worth flagging explicitly.

**3. Routes**

Route `loader`s that call server functions become `useQuery` calls in the
components, so nothing runs at build time.

**4. Nginx — pure static, no app upstream**

`deploy/nginx/mis-quality.conf` / `mis-production.conf`:

```nginx
root /opt/MIS_Projects/Quality/frontend/dist;
index index.html;

location / {
    try_files $uri $uri/ /index.html;   # SPA fallback
}

location /assets/ {
    expires 30d;
    add_header Cache-Control "public, max-age=2592000, immutable";
}
```

`/supabase/`, `/studio/`, `/middleware/`, `/backend/` locations stay as they are.

**5. Docker**

The `app` service (port 8081 / 9000) is no longer needed for the frontend — it is
removed from `docker-compose.quality.yml` and `docker-compose.production.yml`,
along with the `Dockerfile`. That also clears the 8081 port clash you hit, since
Nginx keeps the port.

**6. `deploy/README.md`**

Rewritten upload flow: build → upload `dist/*` → reload Nginx. No container
rebuild, no `docker compose restart app`.

## Confirm before I build

Going static removes the server-side layer, so all role checks rely on database
RLS. If you would rather keep server-side enforcement, the alternative is to keep
SSR and simply rename the output folder to `dist/` (server bundle inside it) — say
which you prefer and I will adjust.
