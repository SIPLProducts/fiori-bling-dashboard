export type MonthSummary = { key: string; name: string; value: number; orders: number };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Month on Month: sums value (₹ Cr) and counts distinct orders per order-created month, oldest first. */
export function summarizeByCreatedMonth(rows: { order: string; orderDate: string; value: number }[]): MonthSummary[] {
  const map = new Map<string, { value: number; orders: Set<string> }>();
  for (const row of rows) {
    const match = /^(\d{4})-(\d{2})/.exec(row.orderDate ?? "");
    if (!match) continue;
    const key = `${match[1]}-${match[2]}`;
    const entry = map.get(key) ?? { value: 0, orders: new Set<string>() };
    entry.value += Number.isFinite(row.value) ? row.value : 0;
    entry.orders.add(row.order);
    map.set(key, entry);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => ({
    key,
    name: `${MONTHS[Number(key.slice(5)) - 1]} ${key.slice(2, 4)}`,
    value: entry.value,
    orders: entry.orders.size,
  }));
}
