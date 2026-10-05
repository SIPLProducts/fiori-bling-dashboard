# Add Model Wise Type chart beside Sales by Model

## Layout
- Place **Sales by Model** and the new **Model Wise** card in one 12-column row on desktop, with each card spanning 6 columns.
- Stack both cards at full width on smaller screens so chart labels and controls remain readable.
- Keep the existing Total LAH and AH Sales cards above this row and the Net Sales List below it.

## Model Wise card
- Group the currently filtered sales rows by the existing **Type** field (`product_type`).
- Sum sales amount for each Type, sort from highest to lowest, and display the Top 10.
- Show the result as a horizontal bar graph with Type labels, sales values, and a tooltip containing the Type, amount, record count, and share.
- Group blank Type values under **Unassigned**.
- Follow every active Sales Dashboard filter and preserve exact negative values where present.

## Sales by Model card
- Keep its existing model calculation, Top 10 / Top 20 / All Models controls, tooltips, and expand action.
- Adjust its normal desktop presentation to fit the 6-column width without clipping model labels or bar values.

## PDF
- Export the two cards together as one page-safe row when space permits.
- Keep the PDF Sales by Model chart limited to Top 10, and export the Model Wise chart as Top 10.
- Preserve repeated headers, footers, date range, and no-cut pagination.

## Validation
- Add aggregation tests confirming Type grouping, sorting, blank handling, record counts, shares, and Top 10 limiting.
- Verify both cards at desktop and narrow widths with long labels, negative values, filters, and empty results.
- Export and visually inspect every PDF page for clipped labels, bars, or cards.
- Run the focused Sales and PDF tests, type checks, and confirm the preview build is clean.
