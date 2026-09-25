# Simplify the Sales Dashboard header

## Changes
- Remove the **Revenue Targets** button from the dashboard header.
- Remove the calendar icon from the date badge.
- Replace the current date text with **“Data available: [from] – [to]”**.
- Calculate `[from]` and `[to]` dynamically from the earliest and latest posting dates across all loaded ZFISALES records.
- Keep this available-data range unchanged when dashboard filters are selected, because it describes the complete ZFISALES dataset—not the selected filter period.
- Do not hard-code dates or change any sales records, filters, totals, charts, or calculations.

## Verification
- Confirm the label matches the actual minimum and maximum ZFISALES posting dates.
- Confirm the calendar icon and Revenue Targets header action are gone.
- Confirm applying filters does not alter the available-data label.
- Check the revised header on desktop and mobile.
