# Order Book tile: same 3 bars as the screen

## Why it differs
- The screen's Sales Document Type card groups by order type: ZDOR, ZSOR and ZEOR, which makes 3 bars.
- The launchpad tile groups by the description text instead. That gives 5 groups: Domestic Sales, Export Sales, Deemed Export Sales, SEZ Sales and a small ZSOR "Export Sales" set. It shows the top 3 and puts the rest in an extra "Others" bar, so you see 4.

## Change
- The Order Book tile will group by order type (ZDOR, ZSOR, ZEOR), the same as the screen. Each bar keeps the screen's label, and there is no "Others" bar.
- The values per bar will match the screen's card.
- The Open Sales Orders tile is unchanged.

## Technical details
- In OrderBookLaunchCard, group on `auart`, using the screen's code/description label. Show every group instead of top 3 + Others. Add an option to summarizeLaunchOrders for this and add a test for it.
