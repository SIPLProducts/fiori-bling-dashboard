# Top 10 Customer Pareto

## Goal
Update the **Customer Contribution Pareto (Top Sales up to 10)** card to show individual customers instead of grouped Top 10/20/30 buckets.

## Changes
- Rank customers dynamically by sales amount after applying all current dashboard filters.
- Display only the first 10 customers, in descending sales order.
- Use one bar per customer for its sales amount and one Pareto line for cumulative contribution.
- Calculate each customer's contribution percentage and cumulative percentage against total sales from all customers in the filtered result, so the tenth point reflects the actual top-10 concentration rather than being forced to 100%.
- Show customer name, sales amount, individual contribution percentage, and cumulative percentage in the tooltip.
- Keep customer labels readable in the normal card and expanded view, using truncation/rotation where needed without changing other dashboard cards.
- Update the card title to **Customer Contribution Pareto (Top Sales up to 10)**.

## Validation
- Add analytics tests confirming descending rank, a maximum of 10 customers, exact individual percentages, and cumulative percentages.
- Verify the chart against live filtered data in both normal and expanded views, including fewer than 10 customers and no-data results.

## Technical details
- Replace the current grouped Pareto buckets in the shared sales analytics result with customer-level entries containing customer name, amount, contribution percentage, and cumulative percentage.
- Preserve the existing live data source and dashboard-wide filter behavior; no database or sync changes are required.
