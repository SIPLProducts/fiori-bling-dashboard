# Inventory Aging: plant-wise cards per ageing bucket

- Keep the existing Plant Wise Ageing card as it is.
- Add a new row below it with four plant-wise cards, one for each ageing bucket, in the same order as the tiles:
  - Plant Wise >365 Days
  - Plant Wise 181–365 Days
  - Plant Wise 91–180 Days
  - Plant Wise 0–90 Days
- Each card lists plants, highest value first, as bars in ₹ Cr. Plants with no value in that bucket are left out. If no plant has a value, the card says so.
- The cards follow the screen filters and appear in the PDF as their own row. The table and Excel stay the same.

## Technical
In `src/components/so-ageing-dashboard.tsx`, use `ageGroup(data, r => r.plantName, r => r.v[i])` for i = 3,2,1,0, filter out values above 0, and render them with BarList in a `data-pdf-block` grid (md:grid-cols-2, xl:grid-cols-4).
