# Redesign the Sales PDF as a four-page executive brief

## Outcome
Replace the current dynamically paginated landscape export with a dedicated, luxury-styled **A4 portrait report containing exactly four pages**. The live Sales Dashboard remains unchanged; only the downloaded PDF changes.

## Report design
- Use an export-only visual system: HBL royal navy, sapphire, teal, emerald, amber, crimson, white cards, fine slate borders, 12px card corners, and modern system sans-serif typography.
- Give every page the same branded header: HBL logo, “HBL MIS Portal”, “Sales & Distribution Executive Brief”, and the actual selected date range.
- Give every page the same footer: confidentiality notice and “Page X of 4”.
- Remove all web-only controls and instructions from the PDF, including filters, tabs, pagination controls, expand icons, live badges, click hints, and dialogs.
- Use compact spacing, tabular figures, readable chart labels, restrained shadows, and consistent section headings.

## Four-page structure
### Page 1 — C-Suite Executive Overview
- One KPI row containing Total Sales and up to three non-zero quarter cards from the selected range.
- Quarter cards retain actual values, variance/partial-period status, and compact monthly charts.
- Place Quarterly Trajectory & Variance Analysis beside Executive Insights.
- Never invent a quarter when the filtered data has no non-zero value.

### Page 2 — Strategic Sales & Segment Distribution
- Sales by Main Group as a clean donut with legend and distribution bar.
- Top 10 Customers as a ranked horizontal bar list.
- Segment Breakdown, Sales Mix, and New vs Repl Sales in one balanced three-column row.

### Page 3 — Operations, Rankings & Executive Alerts
- Top 10 Profit Centres and Top 10 Sales Executives as compact zebra-striped tables with right-aligned values.
- Top 10 Materials beside a combined Total LAH and AH Sales KPI panel.
- Four highest-priority dynamic Management Alerts in a two-by-two matrix with restrained status treatments.

### Page 4 — Model Performance & Customer Contribution
- Top 15 Models by revenue and ₹/AH in one readable horizontal bar chart; no continuation pages.
- Customer Contribution Pareto chart with spaced customer labels, clear amount bars, and a cumulative-percentage line.

## Export implementation
- Build a dedicated export-only report composition from the existing filtered analytics so screen interactions and report calculations remain unchanged.
- Capture four explicit page elements separately at 2× resolution, then place one capture on each A4 portrait PDF page.
- Preserve page margins of 12mm vertically and 10mm horizontally.
- Disable chart animation during capture and wait until every report chart is mounted before export.
- Keep every card inside its assigned page and remove the old automatic block-packing/model continuation behavior from this Sales export path.
- Add semantic PDF-only design tokens and print rules rather than hardcoded component colors.

## Validation
- Export with the current FY default and with a custom date range.
- Confirm the downloaded file always has exactly four pages and uses the real selected range.
- Render all four pages to images and inspect them for clipped cards, overlapping labels, unreadable text, blank charts, excess whitespace, and footer/header alignment.
- Re-export after corrections, run the Sales analytics tests, and confirm the preview build is clean.

## Scope
- No database, synchronization, permissions, calculations, or live dashboard layout changes.
- The report keeps the existing “no zero-total quarter” rule and current-filter behavior.
