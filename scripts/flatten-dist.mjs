/**
 * Post-build step for the static deployment bundle.
 *
 * `vite build` writes the browser bundle to `dist/client` and a helper server
 * bundle to `dist/server`. The server bundle is not used when the portal is
 * hosted statically behind Nginx, so this script flattens the output to:
 *
 *   dist/
 *     index.html
 *     assets/...
 *     favicon.png, robots.txt, ...
 *
 * Upload the contents of `dist/` to `<env>/frontend/dist/` on the server.
 * The script no-ops when `dist/client` is absent (e.g. a platform build).
 */
import { existsSync, readdirSync, renameSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const dist = resolve(process.cwd(), "dist");
const client = join(dist, "client");

if (!existsSync(client)) {
  console.log("[flatten-dist] no dist/client folder — nothing to do");
  process.exit(0);
}

for (const entry of readdirSync(client)) {
  const target = join(dist, entry);
  rmSync(target, { recursive: true, force: true });
  renameSync(join(client, entry), target);
}

rmSync(client, { recursive: true, force: true });
rmSync(join(dist, "server"), { recursive: true, force: true });

// The SPA shell is emitted as _shell.html; Nginx serves it as index.html.
if (!existsSync(join(dist, "index.html")) && existsSync(join(dist, "_shell.html"))) {
  renameSync(join(dist, "_shell.html"), join(dist, "index.html"));
}

console.log("[flatten-dist] dist/ now contains index.html and the client assets");
