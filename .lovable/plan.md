# Clarify the ZFISALES available-data label

## Change
- Remove the calendar icon from the badge beside the Sales Dashboard heading.
- Keep the range fully dynamic from the actual ZFISALES records; do not hard-code or alter the dates.
- With no date filter, show **“Data available: [earliest month] – [latest month]”** based on all available ZFISALES data.
- With a date filter, show **“Selected period: [start month] – [end month]”** so it is not confused with overall data availability.

## Verification
- Confirm the unfiltered label matches the earliest and latest ZFISALES posting dates.
- Confirm selecting and clearing a date filter changes only the label context, not the underlying data or calculations.
