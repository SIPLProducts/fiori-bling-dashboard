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

export type Period = "month" | "quarter" | "year";
export type PeriodPoint = { key: string; label: string; rate: number | null; low: number | null; high: number | null; qty: number; value: number; vendor: string };
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const periodOf = (date: string, p: Period) => {
  const y = Number(date.slice(0, 4)), m = Number(date.slice(5, 7)) - 1;
  if (p === "year") { const fy = m >= 3 ? y + 1 : y; return { key: `${fy}`, label: `FY${String(fy).slice(2)}` }; }
  if (p === "quarter") { const fy = m >= 3 ? y + 1 : y, q = Math.floor(((m + 9) % 12) / 3) + 1; return { key: `${fy}-Q${q}`, label: `Q${q} FY${String(fy).slice(2)}` }; }
  return { key: `${y}-${String(m + 1).padStart(2, "0")}`, label: `${MON[m]}-${String(y).slice(2)}` };
};
const nextKey = (key: string, p: Period) => {
  if (p === "year") return `${Number(key) + 1}`;
  if (p === "quarter") { const [fy, q] = [Number(key.slice(0, 4)), Number(key.slice(6))]; return q === 4 ? `${fy + 1}-Q1` : `${fy}-Q${q + 1}`; }
  const [y, m] = [Number(key.slice(0, 4)), Number(key.slice(5, 7))]; return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
};
const labelOf = (key: string, p: Period) => p === "year" ? `FY${key.slice(2)}` : p === "quarter" ? `${key.slice(5)} FY${key.slice(2, 4)}` : `${MON[Number(key.slice(5, 7)) - 1]}-${key.slice(2, 4)}`;

/** One point per period (qty-weighted rate) from first to last purchase; empty periods have rate null. */
export function periodSeries(rows: PurchaseRow[], p: Period): PeriodPoint[] {
  const m = new Map<string, { label: string; qty: number; amt: number; low: number; high: number; value: number; vend: Map<string, number> }>();
  for (const r of rows) {
    if (!r.rate || r.rate <= 0 || r.value <= 0 || !r.date) continue;
    const { key, label } = periodOf(r.date, p);
    const q = r.qty && r.qty > 0 ? r.qty : 1;
    const e = m.get(key) ?? { label, qty: 0, amt: 0, low: Infinity, high: 0, value: 0, vend: new Map() };
    e.qty += q; e.amt += r.rate * q; e.low = Math.min(e.low, r.rate); e.high = Math.max(e.high, r.rate); e.value += r.value;
    e.vend.set(r.vendorName, (e.vend.get(r.vendorName) ?? 0) + r.value); m.set(key, e);
  }
  const keys = [...m.keys()].sort();
  if (!keys.length) return [];
  const out: PeriodPoint[] = [];
  for (let k = keys[0]!, guard = 0; guard < 500; k = nextKey(k, p), guard++) {
    const e = m.get(k);
    out.push(e ? { key: k, label: e.label, rate: e.amt / e.qty, low: e.low, high: e.high, qty: e.qty, value: e.value, vendor: [...e.vend].sort((a, b) => b[1] - a[1])[0]![0] }
      : { key: k, label: labelOf(k, p), rate: null, low: null, high: null, qty: 0, value: 0, vendor: "" });
    if (k === keys[keys.length - 1]) break;
  }
  return out;
}

/** Spend per vendor (₹ Cr), largest first. */
export function vendorSplit(rows: PurchaseRow[]) {
  const m = new Map<string, number>();
  for (const r of rows) if (r.value > 0) m.set(r.vendorName || r.vendor, (m.get(r.vendorName || r.vendor) ?? 0) + r.value);
  return [...m].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

/** Keep a mover when |change| ≥ minPct, or when smaller but its ₹ value effect (|impact|) reaches minEffectInr. */
export function filterMovers(trends: MaterialTrend[], minPct: number, minEffectInr: number | null) {
  return trends.filter((t) => Math.abs(t.changePct) >= minPct || (minEffectInr != null && Math.abs(t.impact) * 1e7 >= minEffectInr));
}

export type TableRow = { kind: "buy"; point: PeriodPoint } | { kind: "gap"; from: string; to: string; count: number };
/** Collapse runs of empty periods (input in display order) into one gap row. */
export function collapseEmptyPeriods(points: PeriodPoint[]): TableRow[] {
  const out: TableRow[] = [];
  for (const p of points) {
    if (p.rate != null) { out.push({ kind: "buy", point: p }); continue; }
    const last = out[out.length - 1];
    if (last?.kind === "gap") { last.to = p.label; last.count++; } else out.push({ kind: "gap", from: p.label, to: p.label, count: 1 });
  }
  return out;
}
