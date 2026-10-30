# Glassy mode: restore the original look, keep text clear

## Goal
Put back the original light, see-through Glassy look (bright background photo, clear glass cards), but make every name, value and label easy to read.

## What changes
1. **Restore the original glass**
   - Cards, tiles, header and sidebar go back to their original see-through fills.
   - The background photo goes back to its original brightness.
2. **Make text clear without darkening the glass**
   - Add a soft dark shadow behind text in Glassy mode, so names and values stand out from any bright part of the photo.
   - Make secondary text (small labels, captions, "Last Sync" lines) slightly brighter so it doesn't fade into the background.
   - Make headings and values pure bright white.
3. **Blur only, no tint**
   - Increase the frost blur on cards a little, so the photo behind each card turns into a smooth haze instead of sharp shapes, while the glass stays as clear as before.

PDF, Excel and screenshot exports are not affected.

## Technical details
- `src/styles.css` `.glassy` block: revert `--card`, `--card-raised`, `--popover`, `--surface`, `--shell`, `--sidebar`, `--launchpad-tile`, `--launchpad-tile-footer` to the earlier `oklch(1 0 0 / N%)` values, and the body overlay to `55% / 70%`.
- Add `--foreground: oklch(0.99 0 0)` and a brighter `--muted-foreground` (about `oklch(0.86 0.01 60)`) in `.glassy`.
- Add `.glassy body { text-shadow: 0 1px 2px oklch(0 0 0 / 55%), 0 0 10px oklch(0 0 0 / 35%); }`, and exclude it from `svg text`, inputs and `.pdf-export-theme`.
- Keep `backdrop-filter: blur(32px) saturate(150%)` on glass surfaces (standard property only).
