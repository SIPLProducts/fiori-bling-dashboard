# Rename Order Book summary tiles

On the Order Book Report screen and its PDF only (Open Sales Orders stays unchanged):

- Total Open Orders → **Total Orders**
- Open Order Value → **Order Value**
- Pending AH Quantity → **Pending LAH Quantity**, and the figure shows without the "LAH" word (e.g. **0.00** instead of 0.00 LAH). The number itself stays in lakhs with two decimals.

## Technical details
- Switch the three SummaryCard labels on the existing `isBook` flag in the shared dashboard.
- For Order Book, format the AH value with the same lakh/two-decimal rule but no unit suffix (small helper option), and add a test for it.
