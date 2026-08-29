# Clean up the top bar

Remove the whole blue navigation strip (Procurement, Purchase Orders, Suppliers, Sales Analytics, Sales Distribution, Modules, Administration) and move Administration into the user/avatar menu on the right.

## What changes

- The top bar keeps: logo, current page title, search/notification/help icons, and the avatar menu.
- All center navigation links and the Sales Distribution / Modules dropdowns are removed from the bar.
- The avatar menu gains an "Administration" section listing the same admin screens the signed-in user is allowed to see (permission filtering unchanged), above Sign out.
- Users reach reports and modules from the launchpad tiles, as they already can.

## Technical notes

- Edit `src/components/shell-bar.tsx` only:
  - Delete the `<nav>` block and its `navForScreens`, `modulesForScreens`, `sdReportsForScreens` usage plus now-unused imports.
  - Show the page title on all breakpoints instead of mobile only.
  - Inside the account `DropdownMenuContent`, render `adminNavForScreens(screens)` items under an "Administration" label with a separator, then Sign out.
- No route, permission, or data-layer changes.
