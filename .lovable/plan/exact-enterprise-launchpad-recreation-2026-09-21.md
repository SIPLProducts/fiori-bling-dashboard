# Exact enterprise launchpad recreation

## Scope
Rebuild the authenticated launchpad to closely match the attached reference at desktop and responsive sizes. This is a presentation-only redesign of the launchpad; existing report pages, authentication, permissions, routes, and live data behavior remain unchanged.

## Header and navigation
- Recompose the top blue shell with the portal identity and connection label on the left, compact visual-only Alerts and Settings controls on the right, and a user avatar/name treatment matching the reference.
- Place the module navigation in a dedicated blue row below the shell, with a crisp light active state, restrained inactive states, horizontal scrolling on narrow screens, and accessible tab semantics.
- Preserve the existing account menu and sign-out access through the user area.

## Access banner
- Restyle the role banner as the full-width soft white status panel shown in the reference.
- Show the uppercase role badge and current role description on the left.
- Add a green “Live Session Active” status indicator on the right.
- Keep all displayed user and role information connected to the current signed-in account.

## Module sections and layout
- Rebuild the launchpad into the four reference sections: Sales & Distribution, Financial Accounting, Production Planning, and Tables Master.
- Add the small section icon, uppercase heading, right-aligned section subtitle, consistent vertical rhythm, and precise responsive grid behavior.
- On large screens, reproduce the reference proportions: a double-width Total Sales card plus three standard SD cards; five equal FI cards; five equal PP cards; and five compact Tables Master cards.
- On tablets and phones, collapse the grid cleanly without clipped text, overlapping controls, or horizontal page overflow.
- Continue hiding modules and real child tiles the signed-in role cannot access.

## Cards
- Create a shared launchpad-only card system with pure/light cool surfaces, subtle borders, rounded corners, layered soft shadows, restrained inner highlights, and inset pill-style footer actions.
- Match the screenshot’s typography hierarchy, compact spacing, muted labels, blue KPI values, icon badges, separators, progress bars, status indicators, and small bar charts.
- Keep existing live Total Sales data and existing FI/PP KPI data connected where currently available.
- Make each card visibly interactive with pointer, keyboard focus, and a subtle lift/scale response. Keep existing working destinations for Total Sales, Open Sales Orders, FI, PP, and ZFISALES Detail; clicking anywhere on each active card uses its existing dashboard, report, or table route.
- Add the screenshot’s Fulfillment Rate, Billing Cleared, KNA1, MARA, LFA1, and T001W cards as visual-only placeholders using the supplied reference values; clicking one opens a shared slide-over panel stating that the screen is under development, without adding permissions, data sources, or routes.
- Add the FI and PP overview cards and the compact Tables Master presentation required by the reference.
- Use subtle lift/shadow transitions and button feedback, while respecting reduced-motion preferences.

## Design system
- Add launchpad-specific semantic tokens for the cool page background, card surfaces, muted blue text, status tones, borders, footer pills, and multi-layer shadows.
- Use the project’s existing typography and semantic color system rather than hardcoded component colors.
- Preserve dark-theme support, while matching the supplied light-theme reference as the primary target.

## Validation
- Verify the authenticated launchpad at desktop, tablet, and mobile widths against the supplied screenshot.
- Confirm module filtering, role-based visibility, active-card navigation, placeholder slide-over behavior, account sign-out access, keyboard focus, responsive wrapping, and reduced-motion behavior.
- Confirm the page has no browser errors, clipped content, overlap, or horizontal overflow.
- Run the focused type check and formatting/diff validation before completion.

## Not included
- No new backend tables, permissions, SAP integrations, or report pages.
- Alerts, Settings, Fulfillment Rate, Billing Cleared, KNA1, MARA, LFA1, and T001W are visual-only in this iteration.
- The uploaded screenshot is a design reference and will not be embedded in the application.
