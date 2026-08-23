import { SALES_ROWS, type SalesRow } from "./zfisales-data";
import type {
  ComparisonPoint,
  ComparisonSet,
  NamedValue,
  SalesAnalytics,
  SalesFilters,
  SeriesBy,
} from "./zfisales-types";

const MONTH_ORDER = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function monthKey(month: string) {
  const [m, y] = month.split("-");
  return Number(y) * 100 + MONTH_ORDER.indexOf((m ?? "").toUpperCase());
}

function rollup(rows: SalesRow[], pick: (r: SalesRow) => string): NamedValue[] {
  const map = new Map<string, { value: number; count: number }>();
  for (const row of rows) {
    const key = pick(row);
    const entry = map.get(key) ?? { value: 0, count: 0 };
    entry.value += row.amount;
    entry.count += 1;
    map.set(key, entry);
  }
  return [...map.entries()]
    .map(([name, v]) => ({ name, value: Math.round(v.value), count: v.count }))
    .sort((a, b) => b.value - a.value);
}

export function buildSalesAnalytics(filters: SalesFilters): SalesAnalytics {
  const all = SALES_ROWS;
  const term = filters.search.trim().toLowerCase();

  const rows = all.filter((r) => {
    if (filters.fiscalYear && r.fiscalYear !== filters.fiscalYear) return false;
    if (filters.companyCodes.length && !filters.companyCodes.includes(r.companyCode)) return false;
    if (filters.profitCentres.length && !filters.profitCentres.includes(r.profitCtr)) return false;
    if (filters.salesTypes.length && !filters.salesTypes.includes(r.salesType)) return false;
    if (filters.segments.length && !filters.segments.includes(r.segment)) return false;
    if (filters.postingFrom && r.postingDate < filters.postingFrom) return false;
    if (filters.postingTo && r.postingDate > filters.postingTo) return false;
    if (
      term &&
      ![r.customerName, r.customer, r.docNo, r.reference, r.glName, r.profitCtrName].some((v) =>
        String(v).toLowerCase().includes(term),
      )
    )
      return false;
    return true;
  });

  const totalRevenue = rows.reduce((sum, r) => sum + r.amount, 0);
  const documents = new Set(rows.map((r) => r.docNo)).size;
  const customers = new Set(rows.map((r) => r.customer)).size;
  const bySegment = rollup(rows, (r) => r.segment);
  const bySalesType = rollup(rows, (r) => r.salesType);
  const exportRevenue = bySalesType.find((s) => s.name === "Exports")?.value ?? 0;

  const monthly = [...rollup(rows, (r) => r.month)]
    .sort((a, b) => monthKey(a.name) - monthKey(b.name))
    .map((m) => ({ month: m.name, revenue: m.value, documents: m.count ?? 0 }));

  const companies = new Map(all.map((r) => [r.companyCode, r.companyName]));
  const centres = new Map(all.map((r) => [r.profitCtr, r.profitCtrName]));
  const postingDates = all.map((r) => r.postingDate).sort();

  const comparisonBase = all.filter((r) => {
    if (filters.companyCodes.length && !filters.companyCodes.includes(r.companyCode)) return false;
    if (filters.profitCentres.length && !filters.profitCentres.includes(r.profitCtr)) return false;
    if (filters.salesTypes.length && !filters.salesTypes.includes(r.salesType)) return false;
    if (filters.segments.length && !filters.segments.includes(r.segment)) return false;
    if (
      term &&
      ![r.customerName, r.customer, r.docNo, r.reference, r.glName, r.profitCtrName].some((v) =>
        String(v).toLowerCase().includes(term),
      )
    )
      return false;
    return true;
  });

  const series = buildSeriesAnalytics(rows, filters.seriesBy, { companies, centres });

  return {
    options: {
      fiscalYears: [...new Set(all.map((r) => r.fiscalYear))].sort(),
      companies: [...companies.entries()].map(([code, name]) => ({ code, name })).sort((a, b) => a.code.localeCompare(b.code)),
      profitCentres: [...centres.entries()].map(([code, name]) => ({ code, name })).sort((a, b) => a.code.localeCompare(b.code)),
      salesTypes: [...new Set(all.map((r) => r.salesType))].sort(),
      segments: [...new Set(all.map((r) => r.segment))].sort(),
      postingMin: postingDates[0] ?? "",
      postingMax: postingDates[postingDates.length - 1] ?? "",
    },
    kpis: {
      totalRevenue: Math.round(totalRevenue),
      documents,
      customers,
      avgTicket: documents ? Math.round(totalRevenue / documents) : 0,
      topSegmentShare: totalRevenue ? Math.round(((bySegment[0]?.value ?? 0) / totalRevenue) * 1000) / 10 : 0,
      exportShare: totalRevenue ? Math.round((exportRevenue / totalRevenue) * 1000) / 10 : 0,
    },
    monthly,
    byProfitCentre: rollup(rows, (r) => r.profitCtrName),
    bySegment,
    bySalesType,
    byGroup: rollup(rows, (r) => r.group),
    topCustomers: rollup(rows, (r) => r.customerName).slice(0, 8),
    rows: rows.slice(0, 500),
    totalRows: rows.length,
    series,
    comparison: {
      all: buildComparisonSet(comparisonBase),
      selection: buildComparisonSet(rows),
    },
  };
}

function buildSeriesAnalytics(
  rows: SalesRow[],
  seriesBy: SeriesBy,
  lookups: { companies: Map<string, string>; centres: Map<string, string> },
) {
  if (seriesBy === "none" || rows.length === 0) {
    return { dimension: "none" as SeriesBy, keys: [], keyLabels: {}, monthly: [], byDimension: [] };
  }

  const pickKey = seriesBy === "companyCode" ? (r: SalesRow) => r.companyCode : (r: SalesRow) => r.profitCtr;
  const pickName = seriesBy === "companyCode" ? (r: SalesRow) => r.companyName : (r: SalesRow) => r.profitCtrName;
  const lookup = seriesBy === "companyCode" ? lookups.companies : lookups.centres;

  const presentKeys = [...new Set(rows.map(pickKey))];
  const keyLabels: Record<string, string> = {};
  for (const key of presentKeys) {
    const rowName = rows.find((r) => pickKey(r) === key);
    keyLabels[key] = rowName ? pickName(rowName) : lookup.get(key) ?? key;
  }

  // Monthly roll-up per series key
  const monthMap = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const key = pickKey(row);
    const month = row.month;
    const bucket = monthMap.get(month) ?? new Map<string, number>();
    bucket.set(key, (bucket.get(key) ?? 0) + row.amount);
    monthMap.set(month, bucket);
  }

  const monthly = [...monthMap.entries()]
    .map(([month, bucket]) => {
      const point: Record<string, number | string> = { month };
      for (const key of presentKeys) {
        point[key] = Math.round(bucket.get(key) ?? 0);
      }
      return point as { month: string } & Record<string, number>;
    })
    .sort((a, b) => monthKey(a.month) - monthKey(b.month));

  const byDimension = rollup(rows, (r) => (seriesBy === "companyCode" ? r.companyName : r.profitCtrName));

  return { dimension: seriesBy, keys: presentKeys, keyLabels, monthly, byDimension };
}

/** Bucket rows into a period, then compare each period with its predecessor. */
function periodPoints(
  rows: SalesRow[],
  keyOf: (r: SalesRow) => string,
  labelOf: (key: string) => string,
): ComparisonPoint[] {
  const map = new Map<string, { revenue: number; docs: Set<string> }>();
  for (const row of rows) {
    const key = keyOf(row);
    if (!key) continue;
    const entry = map.get(key) ?? { revenue: 0, docs: new Set<string>() };
    entry.revenue += row.amount;
    entry.docs.add(row.docNo);
    map.set(key, entry);
  }
  const keys = [...map.keys()].sort();
  return keys.map((key, i) => {
    const current = Math.round(map.get(key)?.revenue ?? 0);
    const prevKey = i > 0 ? keys[i - 1] : undefined;
    const previous = prevKey ? Math.round(map.get(prevKey)?.revenue ?? 0) : 0;
    const delta = current - previous;
    return {
      period: key,
      label: labelOf(key),
      current,
      previous,
      previousLabel: prevKey ? labelOf(prevKey) : "—",
      delta,
      deltaPct: prevKey && previous !== 0 ? Math.round((delta / Math.abs(previous)) * 1000) / 10 : null,
      documents: map.get(key)?.docs.size ?? 0,
    };
  });
}

function parts(postingDate: string) {
  const [y, m] = postingDate.split("-");
  return { year: y ?? "", month: m ?? "" };
}

export function buildComparisonSet(rows: SalesRow[]): ComparisonSet {
  const yoy = periodPoints(
    rows,
    (r) => parts(r.postingDate).year,
    (key) => key,
  );
  const qoq = periodPoints(
    rows,
    (r) => {
      const { year, month } = parts(r.postingDate);
      if (!year || !month) return "";
      return `${year}-Q${Math.floor((Number(month) - 1) / 3) + 1}`;
    },
    (key) => key.replace("-", " "),
  );
  const mom = periodPoints(
    rows,
    (r) => {
      const { year, month } = parts(r.postingDate);
      return year && month ? `${year}-${month}` : "";
    },
    (key) => {
      const [y, m] = key.split("-");
      return `${MONTH_ORDER[Number(m) - 1] ?? m} ${y}`;
    },
  );
  return { yoy, qoq, mom };
}
