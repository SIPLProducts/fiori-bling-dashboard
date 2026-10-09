# Match Open Orders PDF to the screen

## Confirmed findings
- Plant-wise Pending is rendered only in the screen branch, which is explicitly excluded from PDF. The export branch includes Sales Zone but not Plant.
- The Open Orders export inherits the selected appearance colors, but uses different rendering/layout paths. The precise remaining color mismatch needs verification in a newly downloaded PDF; matching token values alone is insufficient.

## Changes
- Include **Plant-wise Pending** in the PDF as its own complete chart row after Sales Zone, with the same filtered plants, pending values, category colors, and radiant gradients as the screen.
- Reproduce and correct any screen/PDF differences in backgrounds, tiles, donuts, bars, text, dividers, and legend markers in both Light and Dark modes. Preserve the selected mode rather than switching palettes during download.
- Keep the Plant chart’s codes, value axis, and labels readable; do not add its removed bottom summaries.
- Preserve all existing PDF cards, repeated HBL headers, white page margins, numbered footers, and unclipped pagination. Keep the screen layout, calculations, filters, and Excel unchanged.

## Technical details
- Add an export-only Plant capture block using the shared Plant data and gradient helpers, with stable PDF chart dimensions and animation disabled.
- Compare actual captured colors against the screen, including resolved SVG gradient stops and translucent backgrounds; fix only confirmed differences in Open Orders export styling/capture.
- Wait for export charts to complete layout before capture and restore export state after success or failure.

## Verification
- Download fresh PDFs in both modes with identical filters, render every page, and visually compare chart colors and text with the screen.
- Confirm Plant-wise Pending is present once, all plants are visible, and no cards or labels are clipped.
- Reconcile values with the screen and confirm PDF/Excel downloads and normal screen appearance still work.