# Day Wise Production: red bar and tooltip fixes

Why a value showed: 01-06 does have 3 entries worth ₹7,944.93, which is 0.00 Cr, so the chart treats it as no production. The tooltip was showing that small amount.

Changes:
- Tooltip shows the full date as **dd-mm-yyyy** (e.g. 01-06-2026) on every bar.
- Tooltip on a red day shows only the date and **No production**, with no amount and no stray ":".
- The red bar reaches the **top of the chart** (the highest scale line, for example 60.00), not just the tallest green day.
- The grey shaded hover band behind the bar is removed so the bars stay clear.
- Green days are unchanged.

## Technical details
- `DailyChart`: compute `top` as a rounded scale maximum above the tallest day, set YAxis `domain={[0, top]}`, and give red bars `bar = top`. Tooltip `formatter` returns `["No production"]` with an empty name for red days and `cursor={false}`.
