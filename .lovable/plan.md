# Reduce the Open Orders and Quick View row height

## What will change
- Reduce excess vertical spacing in **Open Orders**, **Partial Delivered Orders**, and **Quick View** only.
- Reduce the Quick View header’s top/bottom spacing and the space between each tile’s heading and value.
- Lower the Quick View tiles’ minimum height from 112px to approximately 88px, while retaining readable values, icons, and customer/product details.
- Reduce the status cards’ padding and the gap above their counts. Keep them aligned with the shorter Quick View container on desktop.
- Preserve the grey Quick View header, borders, blue/yellow/violet tiles, white values, and all existing content and calculations.

## Technical details
- Add targeted row/header/body styling hooks and apply compact spacing only beneath the existing screen-only `orders-compact` wrapper.
- Keep PDF sizing unchanged and allow cards to grow naturally if text wraps; do not use a fixed height that clips content.
- Leave other dashboard sections untouched.

## Verification
- Compare the row’s height before and after at desktop and the current preview width.
- Check narrow screens for readable labels and unclipped values/details.
- Confirm the PDF retains its existing layout and the dashboard totals remain unchanged.