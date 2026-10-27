/** Empty placeholders (₹ Cr) until the screen reads live purchase_register data. */
export type PurchaseType = "Domestic" | "Imported" | "Service";
export const PURCHASE_TYPES: PurchaseType[] = ["Domestic", "Imported", "Service"];
export const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

export const TOTAL_PURCHASE = 0;
export const TYPE_TOTALS: Record<PurchaseType, number> = { Domestic: 0, Imported: 0, Service: 0 };

export const MONTHLY: Record<PurchaseType, number[]> = {
  Domestic: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  Imported: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  Service: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

export const QUARTERS = [
  { name: "Q1 Apr-Jun", current: 0, previous: 0 },
  { name: "Q2 Jul-Sep", current: 0, previous: 0 },
  { name: "Q3 Oct-Dec", current: 0, previous: 0 },
  { name: "Q4 Jan-Mar", current: null as number | null, previous: 0 },
];

export const TOP_MATERIALS: { name: string; code: string; group: string; value: number }[] = [];

export const TOP_VENDORS: { name: string; code: string; value: number }[] = [];

export const MATERIAL_GROUPS: { name: string; value: number }[] = [];

export const PLANTS: { code: string; name: string; value: number }[] = [];

export const PROFIT_CENTERS: { code: string; name: string; value: number }[] = [];

const r2 = (v: number) => Math.round(v * 100) / 100;
export const sumValues = (rows: { value: number }[]) => r2(rows.reduce((s, r) => s + r.value, 0));

/** Year-on-year change of the current FY vs the same quarters of the previous FY, in %. */
export function quarterlyYoy(quarters = QUARTERS): number {
  const done = quarters.filter((q) => q.current != null);
  const cur = done.reduce((s, q) => s + (q.current ?? 0), 0);
  const prev = done.reduce((s, q) => s + q.previous, 0);
  return prev ? Math.round(((cur - prev) / prev) * 1000) / 10 : 0;
}

/** Month-wise totals for the selected types and month. */
export function monthlyRows(types: PurchaseType[], month: string | null) {
  return MONTHS.map((m, i) => ({ month: m, Domestic: MONTHLY.Domestic[i]!, Imported: MONTHLY.Imported[i]!, Service: MONTHLY.Service[i]! }))
    .filter((r) => !month || r.month === month)
    .map((r) => ({ ...r, total: types.reduce((s, t) => s + r[t], 0) }));
}
