# Glassy mode: background photo + glass loading cards

## What you will see
1. **Background photo (Glassy mode only)** — a soft, warm, blurred living-room style photo (like your reference) fixed behind the whole portal. A light dark tint sits over it so white text and numbers stay easy to read. Light and Dark modes are unchanged.
2. **Better glass look** — top bar, cards, tiles, filters and tables become frosted see-through panels with a thin bright edge and soft shadow, so the photo glows through like the reference.
3. **Glass loading cards** — while a screen is opening, instead of the flat dark block you saw, Glassy mode shows a page of frosted placeholder cards (a header strip, a row of KPI cards, two large chart cards, then smaller cards) with a gentle shimmer moving across them, matching your second screenshot. This applies to the launchpad and report screens.
4. PDF and Excel downloads stay solid and printable, as now.

## Technical details
- Generate one blurred interior background image into `src/assets/glassy-bg.jpg`; apply it on `.glassy body` with a dark gradient overlay, `background-attachment: fixed`.
- Strengthen glass tokens in `src/styles.css`: translucent card/tile/shell fills, `backdrop-filter: blur(24px) saturate(160%)`, inner top highlight, rounded-2xl cards.
- Update `src/components/ui/skeleton.tsx`: in Glassy mode use frosted fill + shimmer keyframe (`.glassy .skeleton-glass`).
- Add a shared `GlassLoadingPage` layout (header strip, 4 KPI, 2 large, 3 small) and use it in place of the single skeleton blocks in `module.$module.tsx`, `sd-live-dashboard.tsx` and the launchpad loading state (Light/Dark keep the same layout with normal skeleton colour).
- Exclude glass effects inside `.pdf-export-theme`.
