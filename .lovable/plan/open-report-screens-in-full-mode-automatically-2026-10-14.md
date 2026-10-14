# Open report screens in full mode automatically

## What changes

When you open a report screen (Net Sales, Open Sales Orders, Cash Flow, TBN, etc.) from the launchpad, the portal now enters browser full screen by itself — no need to click the Full Screen icon first. The existing Full Screen button in the top bar keeps working to exit/re-enter manually, and the icon stays in sync.

## Behaviour

- Click a screen tile on the launchpad → the screen opens and the browser goes full screen automatically.
- Navigating between screens while not in full screen re-enters full mode, matching how you use the portal.
- A hard page load or refresh of a report URL cannot force full screen — browsers block it without a click — so it simply stays normal in that case.
- Pressing Esc or the top-bar Exit full screen icon still returns to normal; it stays off until you open a screen again.
- Phones/browsers without full screen support (e.g. iPhone Safari) are unaffected.

## Technical details

- Only `src/components/shell-bar.tsx` changes.
- The existing mount `useEffect` (which already tracks `fullscreenchange`) gains an auto-entry step for the screen variant (`launchpad === false`):
  - Skip when `document.fullscreenEnabled` is false, already in full screen, or `navigator.userActivation?.isActive` is false — this is what makes it work only on real navigation clicks and silently skip hard page loads.
  - Otherwise call `document.documentElement.requestFullscreen()` with a `.catch(() => {})` so any browser refusal is ignored.
- No changes to the launchpad, screens, data, queries, PDFs, or the manual Full Screen button.
