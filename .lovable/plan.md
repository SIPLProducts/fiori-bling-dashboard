# Build into `dist/` instead of `.output/`

## Why `.output/` appears today

`npm run build` runs Vite + Nitro, and Nitro's default output folder is `.output/`.
That is why you keep seeing `.output/public`, `.output/server`, `nitro.json`.

## Why there is no `index.html`

This portal is **server-rendered** (TanStack Start). The launchpad, the reports and
the demo login all call server functions (`src/lib/sap.functions.ts`,
`zfisales.functions.ts`, `admin.functions.ts`, `demo.functions.ts`), and pages are
rendered on the server per request. So the build produces a Node server bundle plus
static assets — not a single static `index.html`. Serving a bare `index.html` folder
would break login, the launchpad tiles and every report.

## What will change

**1. `vite.config.ts`** — tell Nitro to emit into `dist/`:

```ts
export default defineConfig({
  tanstackStart: { server: { entry: "server" } },
  nitro: { output: { dir: "dist" } },
});
```

After that, `npm run build` produces:

```text
dist/
  public/        static assets (JS, CSS, images)
  server/
    index.mjs    the app server entry
  nitro.json
  package.json
```

You then upload the **contents of `dist/`** straight into
`/opt/MIS_Projects/Quality/frontend/dist/` — no renaming step, WinSCP path matches
one-to-one.

**2. `deploy/docker/Dockerfile`** — start command stays `node dist/server/index.mjs`
(the volume mounts `frontend/dist` at `/app/dist`), so no change needed; the README
wording is updated to say `dist/` instead of `.output/`.

**3. `deploy/nginx/mis-quality.conf` / `mis-production.conf`** — static root must
point at the `public` subfolder:

```nginx
root /opt/MIS_Projects/Quality/frontend/dist/public;
```

Assets live under `dist/public/_build/...`, so this makes the `/_build/` location
resolve correctly and everything else falls back to the app server.

**4. `deploy/README.md`** — replace the `.output/` upload instructions with `dist/`.

**5. `.gitignore` / `.dockerignore`** — ignore the new `dist/` build folder.

## If you really want a static-only build

That would mean turning off SSR and moving every server function to the browser or
to a separate API. It removes the secure server-side role checks and the SAP data
gateway, so it is not recommended. Say the word if you want that path costed out
separately.
