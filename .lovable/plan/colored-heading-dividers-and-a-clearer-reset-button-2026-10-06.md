# Colored heading dividers and a clearer Reset button

## Heading dividers
- Replace the grey dividers with clearly visible, thin colored borders below the headings.
- Match the ranking dividers to their bars: **Customer — blue**, **Product — green**, **Model Wise — violet**.
- Use distinct accent colors for the other headings: **Sales Document Type — blue**, **Aging Bucket — green**, **Value Trend — amber**, **Sales Zone — teal**.
- Add the divider to **Open Order Lines by Sales Zone** as well.
- Keep heading text, layout, and calculations unchanged; apply divider styling on screen and in PDF exports.

## Radiant chart colors
- Apply richer, subtle gradient fills to the donut segments in **Open Orders by Sales Document Type** and **Open Orders by Aging Bucket**, and the bars in **Open Order Value Trend**.
- Retain each existing category or series color family so the charts remain recognizable; keep legends and breakdown dots coordinated with those colors.
- Use bright-to-deep variations rather than glow effects or decorative backgrounds, preserving readable labels and clear boundaries between segments.
- Apply the same treatment in PDF exports; leave the other charts unchanged.

## Reset button
- Give **Reset** a solid blue background with a contrasting icon and label so it is easy to identify.
- Preserve its location, compact size, reset behavior, and disabled state when no filters need resetting; keep the disabled label readable.

## Technical details and verification
- Use existing semantic color tokens and a configurable divider accent in the shared chart panel.
- Define chart gradient stops through semantic tokens and use uniquely identified chart gradients to avoid collisions between cards.
- Use the existing Button styles rather than introducing a separate control.
- Verify all seven colored dividers, the three gradient-filled charts, coordinated legends, Reset visibility and behavior, narrow-screen readability, and PDF export without clipping.