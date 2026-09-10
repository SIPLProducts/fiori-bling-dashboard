/**
 * Cross-platform static build (Windows / macOS / Linux).
 *
 * `STATIC_BUILD=1 vite build && node scripts/flatten-dist.mjs` uses Unix env
 * syntax that PowerShell and cmd.exe reject. This wrapper sets the flag in
 * Node itself, then runs the Vite build and the flatten step, so
 * `npm run build:static` works the same on every OS.
 *
 * Vite is invoked through its local JS entry instead of relying on the
 * `vite` binary being on PATH, which keeps it working in bare shells too.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

process.env.STATIC_BUILD = "1";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const viteBin = join(root, "node_modules", "vite", "bin", "vite.js");
const flatten = join(root, "scripts", "flatten-dist.mjs");

function run(args) {
  const result = spawnSync(process.execPath, args, {
    stdio: "inherit",
    env: process.env,
    cwd: root,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run([viteBin, "build"]);
run([flatten]);
