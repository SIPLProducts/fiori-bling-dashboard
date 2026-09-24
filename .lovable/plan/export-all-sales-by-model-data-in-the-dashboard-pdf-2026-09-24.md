# Export all Sales by Model data in the dashboard PDF

## Result
- Keep the on-screen **Top 10 Models**, **Top 20 Models**, and **All Models** controls unchanged.
- When **PDF** is clicked, export **Sales by Model (Amount & Per AH)** using **All Models**, regardless of the currently selected on-screen limit.
- Continue applying all active dashboard filters and the shared **Total AH > 0** qualification.
- Restore the user's selected model limit after the PDF finishes or fails.

## PDF behavior
- Expand the model chart height for export so every model, amount label, and per-AH label is captured.
- Preserve the existing A4 landscape, multi-page output and continue excluding only the Net Sales List.
- Wait for the all-model chart to finish rendering before capturing the dashboard.
- Keep the PDF button busy and disabled until export state has been restored.

## Verification
- Export while **Top 10 Models** is selected and confirm the PDF contains every filtered model.
- Confirm the visible chart returns to **Top 10 Models** after download.
- Verify the model chart is not clipped and the Net Sales List remains excluded.
- Run the existing sales analytics tests and type checks.
