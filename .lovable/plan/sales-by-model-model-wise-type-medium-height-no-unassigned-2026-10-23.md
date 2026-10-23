# Sales by Model / Model Wise Type: medium height, no "Unassigned"

Applies to Net Sales, Sales Register and Order Book.

## Changes
1. **Medium card height (screen only)** – Both cards get a fixed medium height (about 380px). Extra bars scroll inside the card instead of making it very tall. Expanded (full-screen) view and PDF keep their current sizing.
2. **Drop "Unassigned"** – Rows with a blank Model are left out of "Sales by Model"; rows with a blank Type are left out of "Model Wise Type". Share % is worked out on the remaining models/types only. Other cards, tiles and totals stay the same.

## Technical details
- `src/components/sd-live-dashboard.tsx`: in `SalesByModelChart` and `ModelWiseChart`, for non-export, non-full mode change the wrapper `max-h-[720px]` to `max-h-[380px]` (with overflow-auto already there). Chart height stays row-based so bars don't get squeezed.
- `src/lib/model-performance.ts`: `rankModels`/`rankTypes` skip blank keys (Sales Register, Order Book).
- `src/lib/sd-live.ts` (Net Sales model/type aggregation near line 733 and the type ranking): skip blank model/type instead of bucketing as "Unassigned". Model-only chart data; KPI totals untouched.
- Update `tests` for model-performance to assert blank model/type rows are excluded.
