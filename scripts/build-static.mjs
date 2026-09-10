/**
 * Cross-platform static build (Windows / macOS / Linux).
 *
 * `STATIC_BUILD=1 vite build && node scripts/flatten-dist.mjs` uses Unix env
 * syntax that PowerShell and cmd.exe reject. This wrapper sets the flag in
 * Node itself, then runs the Vite build and the flatten step, so
 * `npm run build:static` works the same on every OS.
 */
import { spawnSync } from "node:child_process";

process.env.STATIC_BUILD = "1";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("vite", ["build"]);
run(process.execPath, ["scripts/flatten-dist.mjs"]);
