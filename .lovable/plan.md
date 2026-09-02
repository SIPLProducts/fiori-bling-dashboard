# Sales report KPI — clarity improvements

## What changes

1. **Quantity KPI tile**
   Add a "Total quantity" card (units, with UOM note) to the KPI row, next to Total revenue.

2. **GL columns in the document table**
   Add "GL account" and "GL name" columns (data already stored in the sales table but not yet loaded into the screen). They join the existing column picker and CSV export.

3. **Volume & average realization chart — clearer reading**
   - Quantity bars stay green; the average-realization line changes to a strongly contrasting amber/orange, with matching axis-title, legend swatch and point-label colour so each series is unmistakable.
   - Legend labels become "Quantity (units) — left axis" and "Avg realization (INR per unit) — right axis", plus a one-line note explaining realization = revenue ÷ quantity.
   - Bar and line value labels get bigger type, series-matched colour and a light halo so they no longer overlap the bars or each other; labels are thinned out automatically when months are too dense to fit.

4. **Sales mix by type — show values on bars**
   Replace the donut with a horizontal bar chart showing amount and % share printed at the end of each bar (legend list below retained).

5. **Profit-centre colour coding in the table**
   Each distinct profit centre gets a stable colour. In the document table, the Profit centre cell shows a colour chip and the whole row carries a light tint of that colour, so lines of the same profit centre read as one group. A colour legend sits directly above "Document lines (31,862)", showing each profit centre, its chip and its revenue share; the same palette is used in the profit-centre chart so colours stay consistent across the page.

## Technical notes

- `src/lib/sd-live.ts`: add `gl`, `glName` to `SdLine` and the select list; expose total quantity in analytics KPIs.
- `src/components/sd-live-dashboard.tsx`: new KPI card, new columns, colour map keyed by profit centre (deterministic hash into the chart palette), Recharts `LabelList` work for the mix bars and realization line, legend/axis colour alignment.
- Colours come from existing chart tokens in `src/styles.css`; no hardcoded hex in components.
