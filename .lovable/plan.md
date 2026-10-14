# Top bar: remove Search/Help, add Full Screen toggle

## What changes
- Remove the Search (magnifier) and Help (question mark) icons from the top bar on every screen.
- Add a Full Screen button right beside the moon/sun icon, on every screen (launchpad and reports), desktop, tablet and phone.
  - Click it and the portal fills the whole monitor, with no browser tabs or address bar.
  - While in full screen the icon changes to "Exit full screen". Click it (or press Esc) to go back to normal.
  - Moving between screens keeps full screen on, so any screen you open also shows in full screen.
- Everything else in the top bar stays the same: logo, Home, Alerts, Settings, Account menu.

## Technical details
- Only `src/components/shell-bar.tsx` changes:
  - Delete the Search and HelpCircle buttons and their unused imports.
  - Add a ghost icon button after the theme toggle that uses `Maximize`/`Minimize` from lucide-react and calls `document.documentElement.requestFullscreen()` / `document.exitFullscreen()`.
  - Keep the state in sync through a `fullscreenchange` listener in `useEffect`, so pressing Esc updates the icon too. Start with `false` to avoid hydration mismatch.
  - Hide the button when the browser does not support full screen (for example iPhone Safari).
- Full screen stays on during navigation because the app changes screens without reloading the page.
