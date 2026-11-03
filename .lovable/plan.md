# Full-screen view for every Open Purchase Orders card

## What you get
- Each card on the Open Purchase Orders screen (PO Type, Delivery Aging, Daily Trend, Top 10 Vendors, Top 10 Materials, Plant Analytics, Storage Location, Main Group, Sub Group 1/2/3, Purchase Group Overview) gets a small expand icon in its header, top-right.
- Clicking it opens that card in a full-screen window with a larger chart and the same title; press Esc or the close (X) button to return.
- Charts grow to fill the window height; lists and legends keep their values and column names.
- Works in Light, Dark and Glassy themes. PDF/Excel exports stay unchanged; the expand icon is hidden in PDF capture.

## Technical details
- In `src/components/open-po-dashboard.tsx`, extend the local `Card` with an expand button and a full-screen `Dialog` (shadcn) rendering the same children inside a `h-[85vh]` flexible container.
- Pass an `expanded` flag via context so fixed-height chart wrappers (`h-56` etc.) switch to `h-full` when shown full-screen.
- Mark the button `data-pdf-exclude` so captures skip it.
