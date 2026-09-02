# Fix Revenue trend axis labels and single-line customer names

## 1. Revenue trend left axis shows "000.00 Cr"

Cause: when the chart padding was tightened, the left axis was given a fixed width of 58px. Values like "1000.00 Cr" are wider than that, so the first characters get clipped and read as "000.00 Cr".

Fix: give the left axis enough room and shorten the tick text — axis ticks show whole crores (e.g. "1,000 Cr") instead of two decimals, with the axis width raised to fit the widest label. Value labels on the line keep their current precise format, so no information is lost.

## 2. Top customers names must always be on one line

Cause: the chart's category axis draws names as SVG text inside a fixed 230px slot; when a name is wider it wraps onto a second line, and the fixed width doesn't adapt to the screen size.

Fix: render the Top customers card the same way as the new Top 5 Profit Centres card — an HTML row per customer (name, proportional bar, amount). HTML text can never wrap: the name column uses `whitespace-nowrap` with CSS truncation and a hover tooltip for the full name, and the column width is a percentage so it grows on wider screens and in full screen. Long names like "CHITTARANJAN LOCOMOTIVE WORKS" stay on one line at any resolution.

The card keeps its title, accent border, full-screen button, and value labels.

## 3. Amounts adapt to their size (Cr / L / K)

The Top 5 Profit Centres card currently prints raw crore numbers under an "Amount (₹ Cr)" header. Instead the column header becomes just "Amount" and each value uses the same adaptive formatting as the rest of the dashboard: "₹412.30 Cr", "₹45.20 L", "₹8.4 K" depending on magnitude. The same formatting applies to Top customers.

## Technical notes

- `src/components/sd-live-dashboard.tsx`
  - Revenue trend `YAxis`: `width` 58 -> ~78, `tickFormatter` uses a crore-rounded formatter for axis ticks only.
  - Generalise `ProfitCentreBars` into a reusable `BarList` (name, bar, right-aligned value, configurable value formatter and tone) and use it for both Top 5 Profit Centres and Top customers.
  - `HBar` stays available for other charts; the Top customers panel switches to `BarList` with `full` height handling (scrollable-free, rows sized to fill).
- No data, query, or schema changes.
