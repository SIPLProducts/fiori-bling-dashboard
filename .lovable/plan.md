# Inventory Aging: plant-wise cards per ageing bucket

- Keep the existing Plant Wise Ageing card as it is.
- Add a new row below it with four plant-wise cards, one for each ageing bucket, in the same order as the tiles:
  - Plant Wise >365 Days (red)
  - Plant Wise 181–365 Days (gold)
  - Plant Wise 91–180 Days (blue)
  - Plant Wise 0–90 Days (green)
- Each card uses the same column graph as Plant Wise Ageing in your picture: plant names below, ₹ Cr scale on the left, light dashed lines and the same shaded colours. Each card shows only its own bucket, in that bucket's colour, so it needs no colour key.
- Plants are shown highest value first. Plants with no value in that bucket are left out. If no plant has a value, the card says so.
- The cards follow the screen filters and appear in the PDF as their own row. The table and Excel stay the same.

## Technical
In `src/components/so-ageing-dashboard.tsx`, use `ageGroup(data, r => r.plantName, r => r.v[i])` for i = 3,2,1,0 and keep only values above 0. Add a single-series column chart that reuses the BucketColumns axis and gradient styling, with the bucket colour and no legend. Render the four cards in a `data-pdf-block` grid (md:grid-cols-2, xl:grid-cols-4).
