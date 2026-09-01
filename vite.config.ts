// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Default = hosted build (Nitro server bundle). The on-prem static SPA build is
// opt-in through `npm run build:static`, which sets STATIC_BUILD=1. Never infer the
// static build from the absence of an env var: the hosted builder does not always
// set LOVABLE_NITRO_PRESET, and a static output there ships a broken worker.
const isStaticBuild = process.env["STATIC_BUILD"] === "1";

export default defineConfig({
  vite: {
    build: {
      rollupOptions: {
        treeshake: false,
      },
    },
  },
  tanstackStart: {
    // The static SPA shell (dist/index.html) is only for the on-prem Nginx build.
    ...(isStaticBuild ? { spa: { enabled: true } } : {}),
  },
  ...(isStaticBuild ? { nitro: false as const } : {}),
});

