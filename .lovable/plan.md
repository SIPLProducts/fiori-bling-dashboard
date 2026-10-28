## Top 10 Industry Name in one row

**Net Sales**
- Put Top 10 Materials, Top 10 Sales Men and Industry Name side by side in one row (three equal cards on desktop, stacked on small screens).
- Rename the Industry Name card to **Top 10 Industry Name** and show only the top 10 industries by value.

**Sales Register**
- Rename the Industry Name card to **Top 10 Industry Name** and show only the top 10 industries.

PDF follows the screen. Excel keeps the full Industry Name list so no data is lost.

### Technical
- `sd-live-dashboard.tsx` (~line 3191): change the row grid to `lg:grid-cols-3`, rename the panel and slice the industry data to 10.
- `sales-register-dashboard.tsx` (line 114): rename the card and pass `industries.slice(0, 10)`.
