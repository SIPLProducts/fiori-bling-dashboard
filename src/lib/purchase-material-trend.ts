import type { PurchaseRow } from "@/lib/purchase-register-data";

/** Limits for a "frequent, steady" trend — change here only. */
export const TREND_RULES = { minPurchases: 5, minDates: 3, minConsistency: 0.7, minChangePct: 5, maxPct: 1000, minPct: -95 } as const;

export type MaterialTrend = {
  material: string; name: string; unit: string; purchases: number;
  firstDate: string; lastDate: string; firstRate: number; lastRate: number; changePct: number;
  firstQty: number; lastQty: number; qtyChangePct: number; consistency: number;
  /** ₹ Cr effect of the rate change on the latest quantity. */
  impact: number; totalValue: number; direction: "rising" | "falling";
};

const pct = (a: number, b: number) => (a ? ((b - a) / a) * 100 : 0);

/** Purchases for one material collapsed to one point per date (qty-weighted rate). */
export function materialPoints(rows: PurchaseRow[]) {
  const m = new Map<string, { qty: number; amt: number }>();
  for (const r of rows) {
    if (!r.rate || r.rate <= 0 || r.value <= 0) continue;
    const q = r.qty && r.qty > 0 ? r.qty : 1;
    const e = m.get(r.date) ?? { qty: 0, amt: 0 };
    e.qty += q; e.amt += r.rate * q; m.set(r.date, e);
  }
  return [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, e]) => ({ date, qty: e.qty, rate: e.amt / e.qty }));
}

export function materialTrends(rows: PurchaseRow[], rules = TREND_RULES) {
  const by = new Map<string, PurchaseRow[]>();
  for (const r of rows) if (r.material && r.type !== "Service") { const a = by.get(r.material) ?? []; a.push(r); by.set(r.material, a); }
  const rising: MaterialTrend[] = [], falling: MaterialTrend[] = [];
  let scanned = 0, outliers = 0;
  for (const [material, list] of by) {
    const valid = list.filter((r) => (r.rate ?? 0) > 0 && r.value > 0);
    if (valid.length < rules.minPurchases) continue;
    const pts = materialPoints(valid);
    if (pts.length < rules.minDates) continue;
    scanned++;
    const first = pts[0]!, last = pts[pts.length - 1]!;
    const changePct = pct(first.rate, last.rate);
    if (changePct > rules.maxPct || changePct < rules.minPct) { outliers++; continue; }
    if (Math.abs(changePct) < rules.minChangePct) continue;
    const dir = changePct > 0 ? 1 : -1;
    let same = 0, steps = 0;
    for (let i = 1; i < pts.length; i++) { const d = pts[i]!.rate - pts[i - 1]!.rate; if (d === 0) continue; steps++; if (Math.sign(d) === dir) same++; }
    const consistency = steps ? same / steps : 0;
    const n = pts.length, mx = (n - 1) / 2, my = pts.reduce((s, p) => s + p.rate, 0) / n;
    const slope = pts.reduce((s, p, i) => s + (i - mx) * (p.rate - my), 0);
    if (consistency < rules.minConsistency || Math.sign(slope) !== dir) continue;
    const t: MaterialTrend = {
      material, name: valid[0]!.materialName, unit: valid.find((r) => r.unit)?.unit || "", purchases: valid.length,
      firstDate: first.date, lastDate: last.date, firstRate: first.rate, lastRate: last.rate, changePct,
      firstQty: first.qty, lastQty: last.qty, qtyChangePct: pct(first.qty, last.qty), consistency,
      impact: ((last.rate - first.rate) * last.qty) / 1e7, totalValue: valid.reduce((s, r) => s + r.value, 0),
      direction: dir > 0 ? "rising" : "falling",
    };
    (dir > 0 ? rising : falling).push(t);
  }
  const score = (t: MaterialTrend) => Math.abs(t.changePct) * t.consistency * Math.log2(1 + t.purchases);
  rising.sort((a, b) => score(b) - score(a)); falling.sort((a, b) => score(b) - score(a));
  return { rising, falling, scanned, outliers };
}
