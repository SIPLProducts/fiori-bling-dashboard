# Vertical Main Group bar chart + Segment card on its own row

## What changes

### 1. Main Group vs Sub Group (Amount) — vertical bar chart
The card currently draws horizontal bars with names down the left side. Change it to a proper vertical bar chart:

- **X axis (bottom):** Main Group names, angled slightly so names like `RAILWAY ELECTRONICS` and `CONCRETE PRODUCTS` stay readable without wrapping out of the card.
- **Y axis (left):** amount axis with compact ticks (`2,000 Cr`, etc.).
- Value labels sit on top of each bar; the hover tooltip keeps the exact amount and record count.
- Click-to-drill-in (Main Group → its Sub Groups) and the "← All main groups" back link keep working, including in full screen.

### 2. Sales by Segment (Amount) moves to the next row
Today the row holds three cards: Sales by Main Group treemap, Main Group vs Sub Group bars, and Sales by Segment donut. Sales by Segment drops to a new row below, so the treemap and the bar chart each get half the row width and the donut gets the full width of its own row. The donut card keeps its paged legend and behaviour, unchanged.

## Technical notes

- `src/components/sd-live-dashboard.tsx`:
  - `MainGroupBars`: `BarChart` `layout="vertical"` → default horizontal layout; `XAxis` becomes `type="category" dataKey="name"` with `interval={0}` and angled ticks (~-30°); `YAxis` becomes `type="number"` with `axisCompact` ticks; `LabelList` position `top`; grid flips (`vertical={false}`).
  - Layout grid: split the `lg:grid-cols-3` block into a `lg:grid-cols-2` row (treemap + bar chart) followed by a full-width row for the Sales by Segment `Panel`.
- No data, query, or schema changes.
