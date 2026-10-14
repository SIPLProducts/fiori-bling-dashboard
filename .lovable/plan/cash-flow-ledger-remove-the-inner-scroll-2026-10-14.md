# Cash Flow ledger — remove the inner scroll

## What I found

- The current preview code **already shows all 10 rows** of the Cash Flow Transaction Ledger with the Total row, and **no inner vertical scrollbar** — I verified this in a real browser at your window size (949×529) and at full-screen size.
- The screenshot you shared still shows the old behaviour: the table capped at roughly one row with a scrollbar on the right. That is the **previous build**. The old height cap (`max-height: ~110px`) was removed in the last change, so the screenshot must come from a deployment that has not been updated yet (the published app / Quality / Production server).

## Plan

1. **Lock the fix in the code** — set an explicit `max-height: none` on the ledger table wrapper so no leftover or future style can re-introduce the inner scroll. Only horizontal scrolling stays, and only when the columns genuinely don't fit the window.
2. **Verify in the preview** — at your viewport and at full-screen: all 10 rows plus the Total row visible, no scrollbar inside the table, page scrolls normally. Pagination size (10/50/100/500) keeps making the card taller instead of adding an inner scroll.
3. **Get the fix onto the server you were looking at** — publish the Lovable app so the live URL matches, and redeploy the latest build to Quality/Production (the same deploy-and-restart step used for recent changes).

## Technical details

- File: `src/styles.css` — `.cash-table-scroll { overflow-x: auto; max-height: none; }` (currently only `overflow-x: auto`, which lets the browser compute a vertical overflow box; harmless today but worth pinning).
- No changes to data, filters, exports, pagination or the launchpad card.
