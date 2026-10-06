# Compact Sales Zone bars and move the status row

## Sales Zone chart
- Make the vertical bars narrower and bring neighbouring bars closer together.
- Reduce the space allocated to each zone while keeping zone names readable below the bars.
- Show only the open-order line count above each bar; remove the percentage from these labels.
- Keep the numeric scale on the left, existing colours, tooltip details, filters, and calculations unchanged.
- Apply the same compact styling to the PDF, retaining every zone without clipping.

## Row placement
- Move the entire row containing **Open Orders**, **Partial Delivered Orders**, and **Quick View** below the Customer/Product/Model ranking cards and immediately above the detailed table.
- Preserve the row’s existing card contents and layout.
- Keep the same section order in PDF export; the detailed table remains excluded from PDF.

## Technical details
Update only the presentation in `src/components/open-sales-orders-dashboard.tsx`: reduce the Sales Zone category spacing and bar width together, adjust wrapped labels accordingly, replace the bar-label formatter with counts only, and relocate the existing status/Quick View capture block after the ranking block.

## Verification
Check narrower bars and smaller gaps, count-only labels, readable zone names, the moved row directly above the table, and PDF export without clipped charts or cards.