# Remove summary-tile comparisons

- Remove the up/down arrows, percentage changes, and **vs. last period** captions from **Total Open Orders**, **Open Order Value**, and **Open Quantity**.
- Keep each tile’s title, current filtered total, icon, and color unchanged.
- Apply the removal on screen and in the downloaded PDF.
- Leave all filters, calculations of current totals, charts, and other cards unchanged.

## Technical details
- Remove comparison markup and the `delta` property from the shared `SummaryCard` and its three usages.
- Remove the `periodChange` helper if it has no remaining uses.

## Verification
- Confirm all three tiles show their titles and current values without comparison indicators on screen and in the PDF.
- Confirm filtering still updates the totals and the preview has no errors.