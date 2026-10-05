# Show financial year in the Sales PDF header

## Financial-year rule
- Name each April–March period by the year in which it ends:
  - 01 Apr 2024–31 Mar 2025 → **FY25**
  - 01 Apr 2025–31 Mar 2026 → **FY26**
  - 01 Apr 2026–31 Mar 2027 → **FY27**
  - 01 Apr 2027–31 Mar 2028 → **FY28**
  - 01 Apr 2028–31 Mar 2029 → **FY29**
- Therefore, selecting dashboard year **2026** will display **FY27**, because that selection represents 01 Apr 2026–31 Mar 2027.

## PDF change
- Replace the current From/To posting-date pill in the Sales Dashboard PDF header with the applicable short financial-year label.
- For an explicit posting-date range entirely within one April–March period, derive and show that one FY label, including partial ranges.
- If the selection spans more than one April–March period, show every applicable FY label in order, such as **FY25, FY26**.
- Keep the dashboard filters and calculations unchanged; this changes only the period label in the downloaded PDF.

## Technical details
- Add one reusable financial-year display formatter based on the existing April–March fiscal-year calculation.
- Use selected financial years when present; otherwise derive the applicable year or years from the explicit From/To posting dates.
- Keep the default current financial year behavior when no explicit date range is selected.

## Validation
- Test all five supplied date-to-FY examples, partial ranges within one FY, and a range crossing two financial years.
- Download and visually inspect the PDF to confirm the FY label replaces the date range on every page without clipping.
- Run the focused Sales and PDF tests and confirm the preview build is clean.