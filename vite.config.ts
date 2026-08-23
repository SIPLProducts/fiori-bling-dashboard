// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Inside the Lovable build the platform pins its own server target; every other
// build (your local `npm run build`) produces a static SPA that Nginx can serve
// straight from `frontend/dist`.
const isLovableBuild = Boolean(process.env["LOVABLE_NITRO_PRESET"]);

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // Static SPA shell: emits dist/index.html plus the client assets.
    spa: { enabled: true },
  },
  ...(isLovableBuild ? {} : { nitro: false as const }),
});
