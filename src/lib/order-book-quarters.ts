import { buildQuarterSummaries, fiscalQuarter, fiscalYearForDate, type QuarterSummary, type SdLine } from "./sd-live";

type BookRow = { order: string; orderDate: string; value: number };

/** One quarter-input line per order + created date (ERDAT), so counts are distinct orders. */
export function toQuarterLines(rows: BookRow[]): SdLine[] {
  const map = new Map<string, { postingDate: string; amount: number }>();
  for (const row of rows) {
    if (!/^\d{4}-\d{2}-\d{2}/.test(row.orderDate ?? "")) continue;
    const date = row.orderDate.slice(0, 10);
    const key = `${row.order}|${date}`;
    const entry = map.get(key) ?? { postingDate: date, amount: 0 };
    // Order Book row values are ₹ Cr; quarter summaries expect rupees.
    entry.amount += Number.isFinite(row.value) ? row.value * 10_000_000 : 0;
    map.set(key, entry);
  }
  return [...map.values()] as unknown as SdLine[];
}

/** Keep rows whose ERDAT falls in the selected April–March years / quarters (empty = all). */
export function filterByFiscalPeriod<T extends { orderDate: string }>(rows: T[], fiscalYears: string[], quarters: string[]): T[] {
  if (!fiscalYears.length && !quarters.length) return rows;
  return rows.filter((row) => {
    const date = row.orderDate ?? "";
    if (fiscalYears.length && !fiscalYears.includes(fiscalYearForDate(date))) return false;
    if (quarters.length && !quarters.includes(fiscalQuarter(date))) return false;
    return true;
  });
}

export function orderBookFiscalYears(rows: { orderDate: string }[]): string[] {
  return [...new Set(rows.map((row) => fiscalYearForDate(row.orderDate ?? "")).filter(Boolean))].sort((a, b) => b.localeCompare(a));
}

export function buildOrderBookQuarters(
  active: BookRow[],
  comparison: BookRow[],
  fiscalYears: string[],
  quarters: string[],
  range: { from?: string; to?: string } = {},
): QuarterSummary[] {
  return buildQuarterSummaries(toQuarterLines(active), toQuarterLines(comparison), fiscalYears, quarters, range);
}
