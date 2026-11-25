import { fiscalQuarter, fiscalYearForDate, type NamedTotal, type SdLine } from "@/lib/sd-live";

export type QuarterCustomers = { key: string; label: string; items: NamedTotal[] };

/** Top 10 customers per April–March quarter present in the rows, oldest quarter first. */
export function topCustomersByQuarter(rows: readonly Pick<SdLine, "postingDate" | "customer" | "customerName" | "amount">[]): QuarterCustomers[] {
  const groups = new Map<string, Map<string, NamedTotal>>();
  for (const r of rows) {
    const q = fiscalQuarter(r.postingDate), fy = fiscalYearForDate(r.postingDate);
    if (!q || !fy) continue;
    const key = `${fy}-${q}`;
    const m = groups.get(key) ?? new Map<string, NamedTotal>();
    const name = r.customerName || r.customer || "—";
    const c = m.get(name) ?? { name, value: 0, count: 0 };
    c.value += r.amount; c.count += 1; m.set(name, c); groups.set(key, m);
  }
  const keys = [...groups.keys()].sort();
  const multiYear = new Set(keys.map((k) => k.slice(0, 4))).size > 1;
  return keys.map((key) => {
    const [fy, q] = key.split("-") as [string, string];
    const label = `QTR ${q.slice(1)}${multiYear ? ` FY${String(Number(fy) + 1).slice(2)}` : ""}`;
    const items = [...groups.get(key)!.values()].sort((a, b) => b.value - a.value).slice(0, 10);
    return { key, label, items };
  });
}
