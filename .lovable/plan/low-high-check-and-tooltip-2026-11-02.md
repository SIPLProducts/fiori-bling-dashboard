# Low – High: check and tooltip

## The numbers are correct
Low – High shows the **lowest and highest rate paid on that one day**. It does not compare one day with the day before.
- 05-Jun: one rate only, ₹82, so 82 – 82
- 08-Jun: several purchases at ₹82 and ₹135, so 82 – 135. The average weighted by quantity is ₹105.04
- 10-Jun: one rate only, ₹135, so 135 – 135

"82 to 105" and "105 to 135" are moves from one day's price to the next. The **vs previous** column already shows those moves (+28.1%, +28.5%).

## Change
1. When you hover over a Low – High cell, a tooltip shows:
   - Lowest rate ₹X, Highest rate ₹Y, Spread ₹(Y−X)
   - Every rate paid in that period, with its quantity (for example "₹135.00 × 40, ₹82.00 × 25")
   - How the average is worked out: "Price = total value ÷ total qty = ₹105.04"
2. A small info icon on the "Low – High" header, with this tooltip: "Lowest and highest rate paid within this period (not compared with the previous period)."

## Technical
- In `periodSeries`, keep a list of each period's rates and quantities (`rates: {rate, qty}[]`). This is added data and is used only for display.
- Wrap the cell in the shadcn Tooltip in `material-price-page.tsx`.
- Add a unit test: 08-Jun gives low 82, high 135, and a weighted average of 105.04.
