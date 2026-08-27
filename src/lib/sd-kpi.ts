/**
 * ZFISALES_MIS — Sales report KPI aggregation.
 * Pure functions over the sales register extract; filters are posting date
 * range, profit center and plant.
 */
import { SALES_ROWS, type SalesRow } from "./zfisales-data";

export type SdKpiFilters = {
  postingFrom: string;
  postingTo: string;
  profitCentres: string[];
  plants: string[];
};

export type SdKpiNamed = { name: string; value: number; count: number };

export type SdKpiResult = {
  options: {
    profitCentres: { code: string; name: string }[];
    plants: string[];
    postingMin: string;
    postingMax: string;
  };
  kpis: {
    totalRevenue: number;
    documents: number;
    customers: number;
    avgTicket: number;
    topProfitCentre: string;
    topProfitCentreShare: number;
  };
  monthly: { month: string; revenue: number; documents: number }[];
  byProfitCentre: SdKpiNamed[];
  byPlant: SdKpiNamed[];
  rows: Array<{
    docNo: string;
    postingDate: string;
    profitCtr: string;
    profitCtrName: string;
    plant: string;
    customerName: string;
    salesType: string;
    amount: number;
  }>;
  totalRows: number;
};

const MONTH_ORDER = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function monthKey(month: string) {
  const [m, y] = month.split("-");
  return Number(y) * 100 + MONTH_ORDER.indexOf((m ?? "").toUpperCase());
}

/** Plant / site is the location part of the profit centre name (e.g. TGEL-Nandigaon). */
export function plantOf(row: SalesRow): string {
  const parts = row.profitCtrName.split("-");
  return (parts.length > 1 ? parts.slice(1).join("-") : row.profitCtrName).trim();
}

function rollup(rows: SalesRow[], pick: (r: SalesRow) => string): SdKpiNamed[] {
  const map = new Map<string, { value: number; count: number }>();
  for (const row of rows) {
    const key = pick(row) || "—";
    const entry = map.get(key) ?? { value: 0, count: 0 };
    entry.value += row.amount;
    entry.count += 1;
    map.set(key, entry);
  }
  return [...map.entries()]
    .map(([name, v]) => ({ name, value: Math.round(v.value), count: v.count }))
    .sort((a, b) => b.value - a.value);
}

export function buildSdKpi(filters: SdKpiFilters): SdKpiResult {
  const all = SALES_ROWS;

  const rows = all.filter((r) => {
    if (filters.postingFrom && r.postingDate < filters.postingFrom) return false;
    if (filters.postingTo && r.postingDate > filters.postingTo) return false;
    if (filters.profitCentres.length && !filters.profitCentres.includes(r.profitCtr)) return false;
    if (filters.plants.length && !filters.plants.includes(plantOf(r))) return false;
    return true;
  });

  const totalRevenue = rows.reduce((sum, r) => sum + r.amount, 0);
  const documents = new Set(rows.map((r) => r.docNo)).size;
  const customers = new Set(rows.map((r) => r.customer)).size;
  const byProfitCentre = rollup(rows, (r) => r.profitCtrName);
  const byPlant = rollup(rows, plantOf);

  const monthly = rollup(rows, (r) => r.month)
    .sort((a, b) => monthKey(a.name) - monthKey(b.name))
    .map((m) => ({ month: m.name, revenue: m.value, documents: m.count }));

  const centres = new Map(all.map((r) => [r.profitCtr, r.profitCtrName]));
  const postingDates = all.map((r) => r.postingDate).sort();
  const top = byProfitCentre[0];

  return {
    options: {
      profitCentres: [...centres.entries()]
        .map(([code, name]) => ({ code, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      plants: [...new Set(all.map(plantOf))].sort(),
      postingMin: postingDates[0] ?? "",
      postingMax: postingDates[postingDates.length - 1] ?? "",
    },
    kpis: {
      totalRevenue: Math.round(totalRevenue),
      documents,
      customers,
      avgTicket: documents ? Math.round(totalRevenue / documents) : 0,
      topProfitCentre: top?.name ?? "—",
      topProfitCentreShare:
        totalRevenue && top ? Math.round((top.value / totalRevenue) * 1000) / 10 : 0,
    },
    monthly,
    byProfitCentre: byProfitCentre.slice(0, 12),
    byPlant: byPlant.slice(0, 12),
    rows: rows.slice(0, 300).map((r) => ({
      docNo: r.docNo,
      postingDate: r.postingDate,
      profitCtr: r.profitCtr,
      profitCtrName: r.profitCtrName,
      plant: plantOf(r),
      customerName: r.customerName,
      salesType: r.salesType,
      amount: Math.round(r.amount),
    })),
    totalRows: rows.length,
  };
}
