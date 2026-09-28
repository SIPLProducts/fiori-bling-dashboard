# Refactor the Sales Analytics PDF export

## Result
- Keep the on-screen Sales Dashboard unchanged.
- Produce a polished **A4 landscape** PDF using **15 mm top/bottom** and **12 mm left/right** margins.
- Prevent KPI cards, charts, summary areas, and alerts from being cut across pages.
- Organize the report into intentional executive sections rather than slicing one long dashboard image.

## Report structure
1. **Executive Overview & Trajectory**
   - Total Sales and quarterly cards.
   - Quarterly trajectory and executive insights.
2. **Sales Breakdowns & Management View**
   - Main Group, customers, trend, profit centres, segment, contribution, sales mix, New_Repl, and management alerts.
   - Keep each visual row together; move the complete row to the next page when it does not fit.
3. **Detailed Model Analytics**
   - Total LAH and AH Sales summary.
   - All Sales by Model data in groups of up to 10–12 models per page.
   - Repeat the model-chart heading and axis context without using scattered “Continued 2/3/4” titles.

## Branding on every page
- Repeat the official HBL logo at the top left.
- Add **HBL MIS Enterprise Portal — Sales Analytics** beside the logo.
- Show the effective selected date range as one compact pill at the right.
- Add a centered footer with a confidentiality notice and **Page X of Y**.
- Keep Smart Filters, Data Available, Filters, PDF controls, and the Net Sales List excluded.

## PDF-only visual treatment
- Apply the supplied corporate blue, emerald, amber, crimson, and slate palette only while preparing the PDF.
- Restore the normal dashboard appearance immediately after success or failure.
- Increase chart capture to 2× resolution and avoid unnecessary JPEG degradation so text and lines remain sharp.
- Give horizontal charts measured label/value space so model names, amounts, and ₹/AH values do not clip.
- Preserve all active filters and the existing all-model export behavior.

## Technical details
- Extend the shared PDF exporter to compose pages from explicitly marked visual rows instead of relying on arbitrary canvas cuts.
- Pre-compute page compositions so headers, content, and footers fit inside the printable area and total page count is known.
- Add export-only semantic color tokens and print safeguards for break avoidance, overflow, and border cleanup.
- Avoid remote-font embedding during image capture to remove the current cross-origin stylesheet warning while retaining a safe local font stack in the PDF.
- Restore all temporary export state in a guaranteed cleanup path.

## Verification
- Export with explicit and default date ranges and confirm the correct range appears on every page.
- Render every PDF page to images and inspect for cut cards, clipped borders, overlaps, empty continuation pages, unreadable labels, and blurry charts.
- Confirm every page has the HBL header, title, date pill, confidentiality notice, and correct **Page X of Y**.
- Confirm all filtered models are present exactly once, grouped efficiently, while the Net Sales List remains excluded.
- Confirm the normal dashboard styling and selected model limit return unchanged after download or failure.
- Run the existing sales analytics tests and confirm the preview build is clean.
