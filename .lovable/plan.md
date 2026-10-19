# Rename Total AH (LAH) to Total LAH

- On the Order Book screen and in its PDF, the summary tile "Total AH (LAH)" becomes **Total LAH**.
- The value and its rounding rule stay as they are. The Open Sales Orders tile ("Pending AH Quantity") is unchanged.

## Technical details
- `src/components/open-sales-orders-dashboard.tsx`: change the `isBook` label on the AH SummaryCard from "Total AH (LAH)" to "Total LAH".
