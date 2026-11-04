# Open Purchase Orders: keep four cards in one row at 100% zoom

At 100% browser zoom the screen is narrower than the current "4 in a row" cut-off, so the cards wrap to two rows.

- PO Type, Aging, Vendors and Materials stay in one row on any laptop or desktop screen from about 1024px wide. Tablets show two per row; phones show one.
- The donut cards adjust to their own card width, not the window width. The table sits beside the donut when there is room and moves below it only when the card is very narrow, so nothing overflows.
- Plant Analytics and Main Group switch to side-by-side halves from the same width.
- I will check it with screenshots at 100%-zoom laptop widths (1280px and 1440px) before finishing.

## Technical details
- Row 1: change `md:grid-cols-2 xl:grid-cols-4` to `sm:grid-cols-2 lg:grid-cols-4`. Row 2: keep `lg:grid-cols-2`.
- Donut: wrap it in a `@container` and use `@[17rem]:grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)]` (a Tailwind v4 container query) in place of the `sm:` breakpoint.
