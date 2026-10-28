## Sales Register: Top 10 Sales Men card

- Add a **Top 10 Sales Men** card just before Top 10 Industry Name, styled like the other Top 10 cards, ranked by Net Value (₹ Cr).
- Salesman name comes from SAP field **NAME_SE** (already stored for every Sales Register line). Lines without a name are skipped.
- Shows in the PDF too; Excel gets a Sales Man column.

### Technical
- `sales-register-data.ts`: map `salesMan` from `raw.NAME_SE`; bump the query key.
- Dashboard: `industryTotals(rows, r => r.salesMan, r => r.netValue).slice(0,10)` in a RankList card placed in the same row before Industry Name.
- `sales-register-export.ts`: add Sales Man column.
