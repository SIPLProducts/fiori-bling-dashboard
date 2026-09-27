# TBN Financial Dashboard

## Goal
Turn the **TBN** tile’s **View Details** action into a management dashboard modeled on the attached reference, using only live ZTBN measures. Keep the uploaded screenshot as a visual reference only.

## Dashboard experience
- Keep the existing TBN tile under **Financial Accounting**; clicking **View Details** opens the dashboard.
- Use a compact CFO-style header and a responsive, information-dense grid matching the reference’s hierarchy without copying its branding or unsupported measures.
- Add a clear **View Full ZTBN Table** action from the dashboard to the existing searchable, paginated 261-column data view.
- Preserve role-based access, loading, empty, and error states on both views.

## Live ZTBN measures
- Summary tiles: **Total Debit**, **Total Credit**, **Net Balance**, **Cumulative Balance**, and **GL Accounts**.
- Analysis panels:
  - Debit vs Credit by leading profit centres.
  - Debit/Credit composition.
  - Net-balance movement across profit centres (waterfall-style view).
  - Top GL accounts by absolute balance.
  - Profit-centre performance table with debit, credit, and net balance.
  - Debit vs Credit comparison for leading GL accounts.
- Review panels:
  - Dynamic management alerts for unusually large balances, debit-heavy accounts, credit-heavy accounts, and zero/blank balances.
  - Leading GL entries table with GL code, description, debit, credit, net, and a working row-detail action.
- Every amount and alert will be calculated from the current ZTBN rows; no revenue, EBITDA, PAT, monthly trend, cash-flow, receivable, or payable figures will be invented.

## Interactions
- Add profit-centre selection and GL search controls that update every dashboard measure together.
- Chart selections and **View** actions open a focused detail view showing the contributing GL rows and exact debit/credit values.
- Use Indian number formatting and clear debit, credit, positive, negative, and neutral states.
- Ensure chart tooltips remain within the viewport and support keyboard interaction where applicable.

## Technical approach
- Move the current full-table screen to a dedicated child route while keeping its existing search, pagination, horizontal scrolling, and workbook-order columns.
- Make `/reports/fi/tbn` the dashboard destination so the existing tile URL continues to work.
- Add an authenticated ZTBN aggregation reader that respects the existing row-level access rules and derives profit-centre pairs from the registered field definitions.
- Exclude the imported grand-total row from aggregation to avoid double counting; retain it in the full source table.
- Build focused reusable TBN summary, chart, alert, and detail components using the project’s existing chart library and semantic visual tokens.

## Validation
- Verify totals against the stored ZTBN rows and confirm the grand-total record is not counted twice.
- Verify the TBN tile opens the dashboard and the full-table action opens all 261 columns.
- Test filtering, chart/detail clicks, pagination, loading/error/empty states, desktop layout, and mobile horizontal overflow.
- Confirm the application build and relevant automated tests pass.
