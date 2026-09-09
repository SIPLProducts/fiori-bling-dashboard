/**
 * Live data layer for the Management Sales Dashboard.
 * Reads real postings from zfisales_detail (via fetchSdLines) and shapes them
 * into the datasets the reference dashboard cards expect.
 */
import { fetchSdLines, type SdLine } from "@/lib/sd-live";
import { CHART_COLORS } from "@/lib/management-data";
import type {
  MainGroupBlock,
  NamedValue,
  ParetoPoint,
  SalesQtyPoint,
  SegmentSlice,
  TrendPoint,
  ManagementAlert,
  KpiDatum,
} from "@/lib/management-data";

export { fetchSdLines };
export type { SdLine };

const CR = 1e7;
const LAKH = 1e5;

const PALETTE = [
  CHART_COLORS.blue,
  CHART_COLORS.teal,
  CHART_COLORS.purple,
  CHART_COLORS.orange,
  CHART_COLORS.yellow,
  CHART_COLORS.gray,
];

export type MgmtFilters = {
  from: string;
  to: string;
  salesType: string;
  businessSegment: string;
  customer: string;
  profitCentre: string;
  mainGroup: string;
  plant: string;
  companyCode: string;
};

export const emptyMgmtFilters: MgmtFilters = {
  from: "",
  to: "",
  salesType: "",
  businessSegment: "",
  customer: "",
  profitCentre: "",
  mainGroup: "",
  plant: "",
  companyCode: "",
};

type FieldKey = Exclude<keyof MgmtFilters, "from" | "to">;

export const FILTER_DEFS: { key: FieldKey; label: string; pick: (r: SdLine) => string }[] = [
  { key: "salesType", label: "Sales Type", pick: (r) => r.salesType },
  { key: "businessSegment", label: "Segment", pick: (r) => r.businessSegment || r.segment },
  { key: "customer", label: "Customer", pick: (r) => r.customerName || r.customer },
  { key: "profitCentre", label: "Profit Centre", pick: (r) => r.pcShortName || r.profitCtrName || r.profitCtr },
  { key: "mainGroup", label: "Main Group", pick: (r) => r.mainGroup },
  { key: "plant", label: "Plant", pick: (r) => r.plant },
  { key: "companyCode", label: "Company Code", pick: (r) => r.companyCode },
];

export function filterOptions(rows: SdLine[]) {
  const out = {} as Record<FieldKey, string[]>;
  for (const def of FILTER_DEFS) {
    out[def.key] = [...new Set(rows.map(def.pick).filter(Boolean))].sort().slice(0, 500);
  }
  return out;
}

/* ---------------------------------- dates --------------------------------- */

export function dataDateRange(rows: SdLine[]): { min: string; max: string } {
  let min = "";
  let max = "";
  for (const r of rows) {
    if (!r.postingDate) continue;
    if (!min || r.postingDate < min) min = r.postingDate;
    if (!max || r.postingDate > max) max = r.postingDate;
  }
  return { min, max };
}

const day = 86_400_000;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const parse = (s: string) => new Date(`${s}T00:00:00Z`);

export type RangePreset =
  | "All postings"
  | "Last 3 months"
  | "Last 6 months"
  | "Last 12 months"
  | "Current year"
  | "Previous year"
  | "Custom range";

export const RANGE_PRESETS: RangePreset[] = [
  "All postings",
  "Last 3 months",
  "Last 6 months",
  "Last 12 months",
  "Current year",
  "Previous year",
  "Custom range",
];

export function presetRange(preset: RangePreset, bounds: { min: string; max: string }) {
  const { min, max } = bounds;
  if (!min || !max || preset === "All postings" || preset === "Custom range") {
    return { from: min, to: max };
  }
  const end = parse(max);
  const back = (months: number) => {
    const d = new Date(end);
    d.setUTCMonth(d.getUTCMonth() - months);
    d.setUTCDate(d.getUTCDate() + 1);
    return iso(d) < min ? min : iso(d);
  };
  if (preset === "Last 3 months") return { from: back(3), to: max };
  if (preset === "Last 6 months") return { from: back(6), to: max };
  if (preset === "Last 12 months") return { from: back(12), to: max };
  const year = end.getUTCFullYear();
  if (preset === "Current year") return { from: `${year}-01-01`, to: max };
  return { from: `${year - 1}-01-01`, to: `${year - 1}-12-31` };
}

function previousWindow(from: string, to: string) {
  if (!from || !to) return { from: "", to: "" };
  const start = parse(from).getTime();
  const end = parse(to).getTime();
  const span = end - start + day;
  return { from: iso(new Date(start - span)), to: iso(new Date(start - day)) };
}

export function formatRangeLabel(from: string, to: string) {
  if (!from || !to) return "All postings";
  const fmt = (s: string) =>
    parse(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
  return `${fmt(from)} – ${fmt(to)}`;
}

/* --------------------------------- filtering ------------------------------- */

export function applyMgmtFilters(rows: SdLine[], f: MgmtFilters, window?: { from: string; to: string }) {
  const from = window ? window.from : f.from;
  const to = window ? window.to : f.to;
  return rows.filter((r) => {
    if (from && r.postingDate && r.postingDate < from) return false;
    if (to && r.postingDate && r.postingDate > to) return false;
    for (const def of FILTER_DEFS) {
      const wanted = f[def.key];
      if (wanted && def.pick(r) !== wanted) return false;
    }
    return true;
  });
}

/* --------------------------------- analytics ------------------------------- */

type Totals = {
  amount: number;
  quantity: number;
  ah: number;
  customers: Set<string>;
};

const emptyTotals = (): Totals => ({ amount: 0, quantity: 0, ah: 0, customers: new Set() });

function totalsOf(rows: SdLine[]): Totals {
  const t = emptyTotals();
  for (const r of rows) {
    t.amount += r.amount;
    t.quantity += r.quantity;
    t.ah += r.totalAh;
    if (r.customer) t.customers.add(r.customer);
  }
  return t;
}

function monthKey(r: SdLine) {
  return r.postingDate ? r.postingDate.slice(0, 7) : "";
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  const idx = Number(m) - 1;
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${names[idx] ?? m} ${(y ?? "").slice(2)}`;
}

function monthlySeries(rows: SdLine[]) {
  const map = new Map<string, { amount: number; quantity: number }>();
  for (const r of rows) {
    const k = monthKey(r);
    if (!k) continue;
    const cur = map.get(k) ?? { amount: 0, quantity: 0 };
    cur.amount += r.amount;
    cur.quantity += r.quantity;
    map.set(k, cur);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, v]) => ({ key, label: monthLabel(key), amount: v.amount, quantity: v.quantity }));
}

function group(rows: SdLine[], pick: (r: SdLine) => string) {
  const map = new Map<string, number>();
  for (const r of rows) {
    const key = pick(r) || "Unassigned";
    map.set(key, (map.get(key) ?? 0) + r.amount);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function pctDelta(current: number, previous: number): number {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

const cr = (v: number) => Number((v / CR).toFixed(2));

export type ManagementView = {
  totalCr: number;
  comparisonLabel: string;
  currentLabel: string;
  previousLabel: string;
  lineCount: number;
  kpis: KpiDatum[];
  trendMonthly: TrendPoint[];
  trendQuarterly: TrendPoint[];
  trendYtd: TrendPoint[];
  segments: SegmentSlice[];
  profitCentres: NamedValue[];
  customers: NamedValue[];
  pareto: ParetoPoint[];
  mainGroups: MainGroupBlock[];
  salesQuantity: SalesQtyPoint[];
  alerts: ManagementAlert[];
};

export function buildManagementView(
  allRows: SdLine[],
  filters: MgmtFilters,
): ManagementView {
  const current = applyMgmtFilters(allRows, filters);
  const prevWindow = previousWindow(filters.from, filters.to);
  const previous = prevWindow.from ? applyMgmtFilters(allRows, filters, prevWindow) : [];

  const cur = totalsOf(current);
  const prv = totalsOf(previous);

  const currentLabel = formatRangeLabel(filters.from, filters.to);
  const previousLabel = formatRangeLabel(prevWindow.from, prevWindow.to);
  const comparisonLabel = prevWindow.from ? `vs ${previousLabel}` : "vs previous period";

  /* ------------------------------- KPI tiles ------------------------------- */
  const revPerAh = cur.ah ? cur.amount / cur.ah : 0;
  const prevRevPerAh = prv.ah ? prv.amount / prv.ah : 0;
  const revPerCust = cur.customers.size ? cur.amount / cur.customers.size : 0;
  const prevRevPerCust = prv.customers.size ? prv.amount / prv.customers.size : 0;
  const growthPct = pctDelta(cur.amount, prv.amount);

  const money = (v: number) =>
    Math.abs(v) >= CR
      ? `₹ ${(v / CR).toFixed(2)} Cr`
      : Math.abs(v) >= LAKH
        ? `₹ ${(v / LAKH).toFixed(2)} L`
        : `₹ ${Math.round(v).toLocaleString("en-IN")}`;

  const kpis: KpiDatum[] = [
    { id: "sales", label: "Total Sales (Amount)", value: money(cur.amount), delta: growthPct, icon: "rupee", tint: "#E8F0FE", iconColor: "#1769E8" },
    { id: "growth", label: "Sales Growth %", value: `${growthPct.toFixed(1)}%`, delta: growthPct, icon: "growth", tint: "#E6F6EC", iconColor: "#16A34A" },
    { id: "qty", label: "Total Quantity", value: `${(cur.quantity / LAKH).toFixed(2)} Lakhs`, delta: pctDelta(cur.quantity, prv.quantity), icon: "package", tint: "#F1EBFA", iconColor: "#7251B5" },
    { id: "cust", label: "Active Customers", value: cur.customers.size.toLocaleString("en-IN"), delta: pctDelta(cur.customers.size, prv.customers.size), icon: "users", tint: "#FDF0DC", iconColor: "#F59E0B" },
    { id: "ah", label: "Revenue / AH", value: `₹ ${Math.round(revPerAh).toLocaleString("en-IN")}`, delta: pctDelta(revPerAh, prevRevPerAh), icon: "target", tint: "#E2F5F5", iconColor: "#20A8A8" },
    { id: "arpc", label: "Avg. Revenue / Customer", value: money(revPerCust), delta: pctDelta(revPerCust, prevRevPerCust), icon: "user", tint: "#EDEBFB", iconColor: "#6366F1" },
  ];

  /* --------------------------------- trends -------------------------------- */
  const curMonths = monthlySeries(current);
  const prvMonths = monthlySeries(previous);
  const trendMonthly: TrendPoint[] = curMonths.map((m, i) => ({
    month: m.label,
    current: cr(m.amount),
    previous: cr(prvMonths[i]?.amount ?? 0),
  }));

  const trendQuarterly: TrendPoint[] = (() => {
    const out: TrendPoint[] = [];
    for (let i = 0; i < trendMonthly.length; i += 3) {
      const slice = trendMonthly.slice(i, i + 3);
      out.push({
        month: `Q${out.length + 1}`,
        current: Number(slice.reduce((s, r) => s + r.current, 0).toFixed(2)),
        previous: Number(slice.reduce((s, r) => s + r.previous, 0).toFixed(2)),
      });
    }
    return out;
  })();

  const trendYtd: TrendPoint[] = trendMonthly.reduce<TrendPoint[]>((acc, row, i) => {
    const prevRow = acc[i - 1];
    acc.push({
      month: row.month,
      current: Number(((prevRow?.current ?? 0) + row.current).toFixed(2)),
      previous: Number(((prevRow?.previous ?? 0) + row.previous).toFixed(2)),
    });
    return acc;
  }, []);

  /* ------------------------------- breakdowns ------------------------------ */
  const totalAmount = cur.amount || 1;

  const segRows = group(current, (r) => r.businessSegment || r.segment);
  const segTop = segRows.slice(0, 5);
  const segOthers = segRows.slice(5).reduce((s, [, v]) => s + v, 0);
  const segments: SegmentSlice[] = [
    ...segTop.map(([name, value], i) => ({
      name,
      value: cr(value),
      pct: Number(((value / totalAmount) * 100).toFixed(1)),
      color: PALETTE[i % PALETTE.length]!,
    })),
    ...(segOthers > 0
      ? [{ name: "Others", value: cr(segOthers), pct: Number(((segOthers / totalAmount) * 100).toFixed(1)), color: CHART_COLORS.gray }]
      : []),
  ];

  const profitCentres: NamedValue[] = group(
    current,
    (r) => r.pcShortName || r.profitCtrName || r.profitCtr,
  )
    .slice(0, 10)
    .map(([name, value]) => ({ name, value: cr(value) }));

  const customerRows = group(current, (r) => r.customerName || r.customer);
  const customers: NamedValue[] = customerRows
    .slice(0, 10)
    .map(([name, value]) => ({ name, value: cr(value) }));

  /* --------------------------------- pareto -------------------------------- */
  const custTotal = customerRows.reduce((s, [, v]) => s + v, 0) || 1;
  const cut = (n: number) => customerRows.slice(0, n).reduce((s, [, v]) => s + v, 0);
  const buckets = [10, 20, 30, 50, 100].filter((n) => n < customerRows.length);
  const pareto: ParetoPoint[] = [];
  let covered = 0;
  for (const n of buckets) {
    const upto = cut(n);
    pareto.push({
      name: `Top ${n}`,
      amount: cr(upto - covered),
      cumulative: Number(((upto / custTotal) * 100).toFixed(0)),
    });
    covered = upto;
  }
  if (custTotal - covered > 1) {
    pareto.push({ name: "Others", amount: cr(custTotal - covered), cumulative: 100 });
  }

  /* ------------------------------- main groups ----------------------------- */
  const mainRows = group(current, (r) => r.mainGroup);
  const mainTop = mainRows.slice(0, 5);
  const mainOthers = mainRows.slice(5).reduce((s, [, v]) => s + v, 0);
  const mainGroups: MainGroupBlock[] = [
    ...mainTop.map(([name, amount], i) => ({
      name,
      amount: cr(amount),
      pct: Number(((amount / totalAmount) * 100).toFixed(1)),
      color: PALETTE[i % PALETTE.length]!,
    })),
    ...(mainOthers > 0
      ? [{ name: "Others", amount: cr(mainOthers), pct: Number(((mainOthers / totalAmount) * 100).toFixed(1)), color: CHART_COLORS.gray }]
      : []),
  ];

  const salesQuantity: SalesQtyPoint[] = curMonths.map((m) => ({
    month: m.label,
    amount: cr(m.amount),
    quantity: Number((m.quantity / LAKH).toFixed(2)),
  }));

  /* --------------------------------- alerts -------------------------------- */
  const alerts: ManagementAlert[] = [];
  const sign = (v: number) => `${v >= 0 ? "+" : "-"}${Math.abs(v).toFixed(1)}%`;
  alerts.push({
    id: "growth",
    tone: growthPct >= 0 ? "positive" : "negative",
    before: `Total sales ${growthPct >= 0 ? "grew" : "declined"} by `,
    highlight: sign(growthPct),
    after: ` ${comparisonLabel}.`,
  });
  alerts.push({
    id: "top5",
    tone: "warning",
    before: "Top 5 customers contribute ",
    highlight: `${((cut(5) / custTotal) * 100).toFixed(1)}%`,
    after: " of total sales.",
  });
  if (segments[0]) {
    alerts.push({
      id: "seg",
      tone: "positive",
      before: `${segments[0].name} is the largest segment at `,
      highlight: `${segments[0].pct}%`,
      after: " of total sales.",
    });
  }
  if (profitCentres[0]) {
    alerts.push({
      id: "pc",
      tone: "positive",
      before: `${profitCentres[0].name} leads profit centres with `,
      highlight: `₹ ${profitCentres[0].value.toFixed(2)} Cr`,
      after: ".",
    });
  }
  const ahDelta = pctDelta(revPerAh, prevRevPerAh);
  alerts.push({
    id: "ah",
    tone: ahDelta >= 0 ? "positive" : "negative",
    before: `Revenue per AH ${ahDelta >= 0 ? "improved" : "dropped"} by `,
    highlight: sign(ahDelta),
    after: ` ${comparisonLabel}.`,
  });
  const lastMonth = curMonths[curMonths.length - 1];
  const beforeLast = curMonths[curMonths.length - 2];
  if (lastMonth && beforeLast) {
    const qty = pctDelta(lastMonth.quantity, beforeLast.quantity);
    alerts.push({
      id: "qty",
      tone: qty >= 0 ? "positive" : "warning",
      before: `Quantity in ${lastMonth.label} moved `,
      highlight: sign(qty),
      after: ` against ${beforeLast.label}.`,
    });
  }
  if (mainGroups[mainGroups.length - 1]) {
    const smallest = mainGroups[mainGroups.length - 1]!;
    alerts.push({
      id: "main",
      tone: "warning",
      before: `${smallest.name} contributes only `,
      highlight: `${smallest.pct}%`,
      after: " of total sales.",
    });
  }

  return {
    totalCr: cr(cur.amount),
    comparisonLabel,
    currentLabel,
    previousLabel,
    lineCount: current.length,
    kpis,
    trendMonthly,
    trendQuarterly,
    trendYtd,
    segments,
    profitCentres,
    customers,
    pareto,
    mainGroups,
    salesQuantity,
    alerts,
  };
}
