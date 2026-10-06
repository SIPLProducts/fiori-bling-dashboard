# Match Quick View to the reference

Update only the **Quick View** area in Open Sales Orders Reports.

- Keep the **Quick View** heading and its position above the detailed table, beside the two delivery-status cards.
- Show its three items as separate cards inside the Quick View body: **Longest Aging**, **Highest Value**, and **Highest Quantity**.
- Match the reference with light blue, light yellow, and light violet backgrounds, matching colored left-edge accents, circular icons, bold values, and customer/product details below.
- Keep the cards side by side when space allows and stack them on smaller screens without overlapping text.
- Use the current filtered data—not the reference image’s example numbers—and retain full customer/product details in tooltips when shortened.
- Carry the same appearance into the PDF. Leave the status cards, filters, totals, other charts, and table unchanged.

## Technical details
- Restyle `QuickItem` into the three repeated cards with semantic theme colors.
- Replace the shared divider-based Quick View body with a spaced three-column layout; keep its heading without a decorative outer card enclosing the three cards.
- Preserve existing calculations for longest aging, highest open value, and highest open quantity.

## Verification
- Compare the Quick View body with the supplied reference on screen and in the exported PDF.
- Check that names and values fit, filtered data still drives the cards, and the preview has no errors.