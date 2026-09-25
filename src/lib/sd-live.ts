import { supabase } from "@/integrations/supabase/client";

/** One document line from zfisales_detail, client-safe. */
export type SdLine = {
  docNo: string;
  docItem: string;
  postingDate: string;
  month: string;
  fiscalYear: string;
  plant: string;
  gl: string;
  glName: string;
  companyCode: string;
  customer: string;
  customerName: string;
  customerProfile: string;
  profitCtr: string;
  profitCtrName: string;
  pcShortName: string;
  mainGroup: string;
  subGroup: string;
  newRepl: string;
  salesType: string;
  segment: string;
  businessSegment: string;
  material: string;
  materialDesc: string;
  productGroup: string;
  model: string;
  productRange: string;
  productType: string;
  divisionName: string;
  industryName: string;
  countryName: string;
  salesOrder: string;
  salesZone: string;
  salesRepName: string;
  incoterms: string;
  usageDesc: string;
  unit: string;
  quantity: number;
  ah: number;
  totalAh: number;
  amount: number;
};

const COLUMNS =
  "doc_no, doc_item, posting_date, month, fiscal_year, plant, gl, gl_name, company_code, customer, customer_name, customer_profile, profit_ctr, profit_ctr_name, pc_short_name, main_group, sub_group, new_repl, sales_type, segment, material, material_desc, product_group, model, product_range, product_type, division_name, industry_name, country_name, sales_order, sales_zone, sales_rep_name, incoterms, usage_desc, unit, quantity, ah, total_ah, amount, business_segment";

const PAGE = 1000;
/** How many page requests run at once; keeps the first paint fast on 30k+ lines. */
const CONCURRENCY = 8;
const CONSISTENCY_ATTEMPTS = 3;

type Row = Record<string, unknown>;
const s = (v: unknown) => (v == null ? "" : String(v));
const n = (v: unknown) => Number(v ?? 0);

/** Parse numeric SAP/database values consistently, including CSV-style commas. */
export const salesNumber = (value: unknown): number => {
  const parsed = Number(String(value ?? 0).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

/** The one shared rowset used by both AH summary tiles. */
export function qualifyingTotalAhRows(rows: SdLine[]): SdLine[] {
  return rows.filter((row) => salesNumber(row.totalAh) > 0);
}

export type SdDatasetMarker = {
  count: number;
  latestUpdatedAt: string;
};

const sameMarker = (left: SdDatasetMarker, right: SdDatasetMarker) =>
  left.count === right.count && left.latestUpdatedAt === right.latestUpdatedAt;

type ConsistentPageOptions<T> = {
  readMarker: () => Promise<SdDatasetMarker>;
  readPage: (from: number) => Promise<T[]>;
  rowKey: (row: T) => string;
  pageSize?: number;
  concurrency?: number;
  maxAttempts?: number;
};

/**
 * Loads one complete dataset version. If rows change while offset pages are in
 * flight, the mixed result is discarded and the now-complete version is read.
 */
export async function loadConsistentPagedRows<T>({
  readMarker,
  readPage,
  rowKey,
  pageSize = PAGE,
  concurrency = CONCURRENCY,
  maxAttempts = CONSISTENCY_ATTEMPTS,
}: ConsistentPageOptions<T>): Promise<T[]> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const before = await readMarker();
    const offsets = Array.from(
      { length: Math.ceil(before.count / pageSize) },
      (_, index) => index * pageSize,
    );
    const pages: T[][] = [];
    for (let i = 0; i < offsets.length; i += concurrency) {
      const batch = offsets.slice(i, i + concurrency);
      pages.push(...(await Promise.all(batch.map((from) => readPage(from)))));
    }

    const after = await readMarker();
    const rows = pages.flat();
    const uniqueKeys = new Set(rows.map(rowKey));
    if (sameMarker(before, after) && rows.length === before.count && uniqueKeys.size === rows.length) {
      return rows;
    }
  }
  throw new Error("Sales data changed while loading. Please retry after the current sync completes.");
}

async function readActiveMarker(): Promise<SdDatasetMarker> {
  const [countResult, latestResult] = await Promise.all([
    supabase
      .from("zfisales_detail")
      .select("id", { count: "exact", head: true })
      .eq("is_active_snapshot", true),
    supabase
      .from("zfisales_detail")
      .select("updated_at")
      .eq("is_active_snapshot", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (countResult.error) throw countResult.error;
  if (latestResult.error) throw latestResult.error;
  return {
    count: countResult.count ?? 0,
    latestUpdatedAt: latestResult.data?.updated_at ?? "",
  };
}

async function fetchPage(from: number): Promise<Row[]> {
  const { data, error } = await supabase
    .from("zfisales_detail")
    .select(`id, ${COLUMNS}`)
    .eq("is_active_snapshot", true)
    .order("posting_date", { ascending: true })
    .order("id", { ascending: true })
    .range(from, from + PAGE - 1);
  if (error) throw error;
  return (data ?? []) as unknown as Row[];
}

/** Live posting lines straight from the sales table, paged in parallel. */
export async function fetchSdLines(): Promise<SdLine[]> {
  const rows: SdLine[] = [];
  const loadedRows = await loadConsistentPagedRows({
    readMarker: readActiveMarker,
    readPage: fetchPage,
    rowKey: (row) => s(row["id"]),
  });

  for (const r of loadedRows) {
      rows.push({
        docNo: s(r["doc_no"]),
        docItem: s(r["doc_item"]),
        postingDate: s(r["posting_date"]),
        month: s(r["month"]),
        fiscalYear: s(r["fiscal_year"]),
        plant: s(r["plant"]),
        gl: s(r["gl"]),
        glName: s(r["gl_name"]),
        companyCode: s(r["company_code"]),
        customer: s(r["customer"]),
        customerName: s(r["customer_name"]),
        customerProfile: s(r["customer_profile"]),
        profitCtr: s(r["profit_ctr"]),
        profitCtrName: s(r["profit_ctr_name"]),
        pcShortName: s(r["pc_short_name"]),
        mainGroup: s(r["main_group"]),
        subGroup: s(r["sub_group"]),
        newRepl: s(r["new_repl"]),
        salesType: s(r["sales_type"]),
        segment: s(r["segment"]),
        businessSegment: s(r["business_segment"]),
        material: s(r["material"]),
        materialDesc: s(r["material_desc"]),
        productGroup: s(r["product_group"]),
        model: s(r["model"]),
        productRange: s(r["product_range"]),
        productType: s(r["product_type"]),
        divisionName: s(r["division_name"]),
        industryName: s(r["industry_name"]),
        countryName: s(r["country_name"]),
        salesOrder: s(r["sales_order"]),
        salesZone: s(r["sales_zone"]),
        salesRepName: s(r["sales_rep_name"]),
        incoterms: s(r["incoterms"]),
        usageDesc: s(r["usage_desc"]),
        unit: s(r["unit"]),
        quantity: n(r["quantity"]),
        ah: n(r["ah"]),
        totalAh: n(r["total_ah"]),
        amount: n(r["amount"]),
      });
  }
  return rows;
}

/**
 * Watches the sales table and calls back whenever postings change,
 * so dashboards refresh without a manual reload.
 */
export function subscribeSdLines(onChange: () => void): () => void {
  const channel = supabase
    .channel("zfisales-detail-live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "zfisales_detail" },
      () => onChange(),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

export type SdFilters = {
  from: string;
  to: string;
  fiscalYears: string[];
  quarters: string[];
  plants: string[];
  profitCentres: string[];
  segments: string[];
  customers: string[];
  search: string;
};

export const emptySdFilters: SdFilters = {
  from: "",
  to: "",
  fiscalYears: [],
  quarters: [],
  plants: [],
  profitCentres: [],
  segments: [],
  customers: [],
  search: "",
};

export function fiscalQuarter(postingDate: string): string {
  const month = Number(postingDate.slice(5, 7));
  if (month >= 4 && month <= 6) return "Q1";
  if (month >= 7 && month <= 9) return "Q2";
  if (month >= 10 && month <= 12) return "Q3";
  if (month >= 1 && month <= 3) return "Q4";
  return "";
}

export type QuarterSummary = {
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  amount: number;
  baselineAmount: number | null;
  changePct: number | null;
  comparisonLabel: string;
  varianceAmount: number | null;
  periodLabel: string;
  comparisonMode: "qoq" | "yoy";
  trend: { label: string; value: number }[];
};

const FISCAL_QUARTER_ORDER = ["Q1", "Q2", "Q3", "Q4"] as const;

function quarterAmount(rows: SdLine[], fiscalYear: string | null, quarter: string): number {
  return rows.reduce(
    (sum, row) =>
      (!fiscalYear || row.fiscalYear === fiscalYear) && fiscalQuarter(row.postingDate) === quarter
        ? sum + row.amount
        : sum,
    0,
  );
}

const QUARTER_MONTHS: Record<(typeof FISCAL_QUARTER_ORDER)[number], number[]> = {
  Q1: [4, 5, 6],
  Q2: [7, 8, 9],
  Q3: [10, 11, 12],
  Q4: [1, 2, 3],
};

const QUARTER_PERIODS: Record<(typeof FISCAL_QUARTER_ORDER)[number], string> = {
  Q1: "Apr–Jun",
  Q2: "Jul–Sep",
  Q3: "Oct–Dec",
  Q4: "Jan–Mar",
};

function dateYear(postingDate: string): number | null {
  const year = Number(postingDate.slice(0, 4));
  return Number.isFinite(year) && year > 0 ? year : null;
}

function dateRangeMonths(rows: SdLine[], from = "", to = ""): number {
  const dates = rows.map((row) => row.postingDate).filter(Boolean).sort();
  const start = new Date(from || dates[0] || "");
  const end = new Date(to || dates.at(-1) || "");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth() + 1;
}

function calendarQuarterAmount(rows: SdLine[], year: number, quarter: string): number | null {
  const matching = rows.filter(
    (row) => dateYear(row.postingDate) === year && fiscalQuarter(row.postingDate) === quarter,
  );
  if (!matching.length) return null;
  return matching.reduce(
    (sum, row) => dateYear(row.postingDate) === year && fiscalQuarter(row.postingDate) === quarter
      ? sum + row.amount
      : sum,
    0,
  );
}

function quarterTrend(rows: SdLine[], quarter: (typeof FISCAL_QUARTER_ORDER)[number]): { label: string; value: number }[] {
  const months = QUARTER_MONTHS[quarter];
  return months.map((month) => ({
    label: String(month).padStart(2, "0"),
    value: rows.reduce(
      (sum, row) => Number(row.postingDate.slice(5, 7)) === month ? sum + row.amount : sum,
      0,
    ),
  }));
}

/** Build visible fiscal-quarter totals and their requested QoQ/YoY baselines. */
export function buildQuarterSummaries(
  activeRows: SdLine[],
  comparisonRows: SdLine[],
  fiscalYears: string[],
  selectedQuarters: string[],
  dateRange: { from?: string; to?: string } = {},
): QuarterSummary[] {
  const visible = FISCAL_QUARTER_ORDER.filter(
    (quarter) => !selectedQuarters.length || selectedQuarters.includes(quarter),
  );
  const years = [...new Set(fiscalYears)].sort((a, b) => a.localeCompare(b));
  const currentYear = years.at(-1) ?? null;
  const baselineYear = years.length > 1 ? years.at(-2) ?? null : null;
  const comparisonMode: "qoq" | "yoy" = years.length > 1 || (!years.length && dateRangeMonths(activeRows, dateRange.from, dateRange.to) >= 18)
    ? "yoy"
    : "qoq";
  const latestDateYear = Math.max(0, ...activeRows.map((row) => dateYear(row.postingDate) ?? 0));

  return visible.map((quarter, index) => {
    const matchingYears = activeRows
      .filter((row) => fiscalQuarter(row.postingDate) === quarter)
      .map((row) => dateYear(row.postingDate))
      .filter((year): year is number => year != null);
    const inferredYear = Math.max(0, ...matchingYears) || latestDateYear;
    const currentRows = currentYear
      ? activeRows.filter((row) => row.fiscalYear === currentYear && fiscalQuarter(row.postingDate) === quarter)
      : activeRows.filter((row) => dateYear(row.postingDate) === inferredYear && fiscalQuarter(row.postingDate) === quarter);
    const amount = currentRows.reduce((sum, row) => sum + row.amount, 0);
    let baselineAmount: number | null = null;
    let comparisonLabel = "No comparison";

    if (currentYear && baselineYear) {
      baselineAmount = quarterAmount(comparisonRows, baselineYear, quarter);
      comparisonLabel = `vs ${baselineYear} ${quarter}`;
    } else if (currentYear) {
      const priorSelected = visible[index - 1];
      if (priorSelected) {
        baselineAmount = quarterAmount(activeRows, currentYear, priorSelected);
        comparisonLabel = `vs ${priorSelected}`;
      } else {
        const quarterIndex = FISCAL_QUARTER_ORDER.indexOf(quarter);
        const previousQuarter = FISCAL_QUARTER_ORDER[(quarterIndex + 3) % 4];
        const previousYear = quarter === "Q1" && /^\d+$/.test(currentYear)
          ? String(Number(currentYear) - 1)
          : currentYear;
        baselineAmount = previousQuarter
          ? quarterAmount(comparisonRows, previousYear, previousQuarter)
          : null;
        comparisonLabel = previousQuarter ? `vs ${previousYear} ${previousQuarter}` : "No comparison";
      }
    } else if (currentRows.length && comparisonMode === "yoy") {
      baselineAmount = calendarQuarterAmount(comparisonRows, inferredYear - 1, quarter);
      comparisonLabel = `vs ${inferredYear - 1} ${quarter}`;
    } else if (currentRows.length) {
      const priorSelected = visible[index - 1];
      if (priorSelected) {
        const priorYears = activeRows
          .filter((row) => fiscalQuarter(row.postingDate) === priorSelected)
          .map((row) => dateYear(row.postingDate))
          .filter((year): year is number => year != null && year <= inferredYear);
        const priorYear = Math.max(0, ...priorYears) || inferredYear;
        baselineAmount = calendarQuarterAmount(activeRows, priorYear, priorSelected);
        comparisonLabel = `vs ${priorSelected}`;
      } else {
        const quarterIndex = FISCAL_QUARTER_ORDER.indexOf(quarter);
        const previousQuarter = FISCAL_QUARTER_ORDER[(quarterIndex + 3) % 4];
        const previousYear = quarter === "Q4" ? inferredYear - 1 : inferredYear;
        baselineAmount = previousQuarter
          ? calendarQuarterAmount(comparisonRows, previousYear, previousQuarter)
          : null;
        comparisonLabel = previousQuarter ? `vs ${previousYear} ${previousQuarter}` : "No comparison";
      }
    }

    const validBaseline = baselineAmount != null && baselineAmount !== 0;

    return {
      quarter,
      amount,
      baselineAmount,
      changePct: validBaseline ? ((amount - baselineAmount) / Math.abs(baselineAmount)) * 100 : null,
      comparisonLabel,
      varianceAmount: validBaseline ? amount - baselineAmount : null,
      periodLabel: QUARTER_PERIODS[quarter],
      comparisonMode,
      trend: quarterTrend(currentRows, quarter),
    };
  });
}

export function applySdFilters(rows: SdLine[], f: SdFilters): SdLine[] {
  const term = f.search.trim().toLowerCase();
  const inList = (list: string[], value: string) => !list.length || list.includes(value);
  return rows.filter((r) => {
    if (f.from && r.postingDate && r.postingDate < f.from) return false;
    if (f.to && r.postingDate && r.postingDate > f.to) return false;
    if (!inList(f.fiscalYears, r.fiscalYear)) return false;
    if (!inList(f.quarters, fiscalQuarter(r.postingDate))) return false;
    if (!inList(f.plants, r.plant)) return false;
    if (
      f.profitCentres.length &&
      !f.profitCentres.some((value) =>
        [r.profitCtr, r.profitCtrName, r.pcShortName].filter(Boolean).includes(value),
      )
    )
      return false;
    if (!inList(f.segments, r.businessSegment || r.segment)) return false;
    if (!inList(f.customers, r.customerName || r.customer)) return false;
    if (
      term &&
      ![r.docNo, r.customer, r.customerName, r.material, r.materialDesc, r.salesOrder, r.model]
        .join(" ")
        .toLowerCase()
        .includes(term)
    )
      return false;
    return true;
  });
}

export type NamedTotal = { name: string; value: number; count: number };

export type ModelPerformance = {
  model: string;
  totalAmount: number;
  totalAh: number;
  perAhRate: number;
  recordCount: number;
  salesSharePct: number;
};

export function limitModelPerformance(items: ModelPerformance[], limit: 10 | 20 | "all") {
  return limit === "all" ? items : items.slice(0, limit);
}

function rank(map: Map<string, NamedTotal>, limit?: number): NamedTotal[] {
  const list = [...map.values()].sort((a, b) => b.value - a.value);
  return limit ? list.slice(0, limit) : list;
}

function add(map: Map<string, NamedTotal>, name: string, value: number) {
  const key = name || "—";
  const cur = map.get(key) ?? { name: key, value: 0, count: 0 };
  cur.value += value;
  cur.count += 1;
  map.set(key, cur);
}

export type Delta = { pct: number | null; label: string };

export type SdAnalytics = {
  kpis: {
    revenue: number;
    documents: number;
    lines: number;
    customers: number;
    avgDoc: number;
    linesPerDoc: number;
    quantity: number;
    totalAh: number;
    positiveAhTotal: number;
    positiveAhSales: number;
    avgRealization: number;
    revenuePerAh: number;
    revenuePerCustomer: number;
    momPct: number | null;
    momLabel: string;
    topProfitCentre: string;
    topProfitCentreValue: number;
  };
  deltas: {
    revenue: Delta;
    growth: Delta;
    quantity: Delta;
    customers: Delta;
    revenuePerAh: Delta;
    revenuePerCustomer: Delta;
  };
  pareto: {
    customer: string;
    value: number;
    contributionPct: number;
    cumulativePct: number;
  }[];
  alerts: { tone: "up" | "down" | "warn"; text: string }[];
  mixByType: NamedTotal[];
  byNewRepl: NamedTotal[];
  unassignedNewReplCount: number;
  bySegment: NamedTotal[];
  topProfitCentres: NamedTotal[];
  monthly: {
    month: string;
    revenue: number;
    documents: number;
    quantity: number;
    realization: number;
  }[];
  topCustomers: NamedTotal[];
  topMaterials: NamedTotal[];
  topSalesEmployees: NamedTotal[];
  modelPerformance: ModelPerformance[];
  byMainGroup: NamedTotal[];
  subGroupsByMainGroup: Record<string, NamedTotal[]>;
  divisionsByMainGroup: Record<string, NamedTotal[]>;
  divisionsBySubGroup: Record<string, Record<string, NamedTotal[]>>;
  rows: SdLine[];
};




const MONTH_INDEX = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function monthSortKey(label: string): string {
  const [m, y] = label.split("-");
  const idx = MONTH_INDEX.indexOf((m ?? "").toUpperCase());
  return idx >= 0 && y ? `${y}-${String(idx + 1).padStart(2, "0")}` : label;
}

export function buildSdAnalytics(rows: SdLine[]): SdAnalytics {
  const byType = new Map<string, NamedTotal>();
  const byNewRepl = new Map<string, NamedTotal>();
  const byPc = new Map<string, NamedTotal>();
  const byCust = new Map<string, NamedTotal>();
  const byMat = new Map<string, NamedTotal>();
  const byEmp = new Map<string, NamedTotal>();
  const bySeg = new Map<string, NamedTotal>();
  const byMain = new Map<string, NamedTotal>();
  const bySub = new Map<string, Map<string, NamedTotal>>();
  const byMainDivision = new Map<string, Map<string, NamedTotal>>();
  const bySubDivision = new Map<string, Map<string, Map<string, NamedTotal>>>();
  const byMonth = new Map<
    string,
    {
      month: string;
      revenue: number;
      quantity: number;
      ah: number;
      docs: Set<string>;
      customers: Set<string>;
    }
  >();



  const docs = new Set<string>();
  const customers = new Set<string>();
  let revenue = 0;
  let quantity = 0;
  let totalAh = 0;
  let positiveAhTotal = 0;
  let positiveAhSales = 0;
  let unassignedNewReplCount = 0;

  const qualifyingRows = qualifyingTotalAhRows(rows);
  const byModel = new Map<string, Omit<ModelPerformance, "perAhRate" | "salesSharePct">>();
  for (const row of qualifyingRows) {
    positiveAhTotal += salesNumber(row.totalAh);
    // Negative local-currency amounts remain included when Total AH is positive.
    positiveAhSales += salesNumber(row.amount);
    const model = row.model.trim() || "Unassigned";
    const current = byModel.get(model) ?? { model, totalAmount: 0, totalAh: 0, recordCount: 0 };
    current.totalAmount += salesNumber(row.amount);
    current.totalAh += salesNumber(row.totalAh);
    current.recordCount += 1;
    byModel.set(model, current);
  }

  const modelPerformance = [...byModel.values()]
    .map((item) => ({
      ...item,
      perAhRate: item.totalAh > 0 ? item.totalAmount / item.totalAh : 0,
      salesSharePct: positiveAhSales !== 0 ? (item.totalAmount / positiveAhSales) * 100 : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount || a.model.localeCompare(b.model));

  for (const r of rows) {
    revenue += r.amount;
    quantity += r.quantity;
    totalAh += r.totalAh;
    if (r.docNo) docs.add(`${r.fiscalYear}/${r.docNo}`);
    if (r.customer) customers.add(r.customer);
    add(byType, r.salesType, r.amount);
    if (r.newRepl.trim()) add(byNewRepl, r.newRepl.trim(), r.amount);
    else unassignedNewReplCount += 1;
    add(byPc, r.pcShortName || r.profitCtrName || r.profitCtr, r.amount);
    add(byCust, r.customerName || r.customer, r.amount);
    add(byMat, r.materialDesc || r.material, r.amount);
    add(byEmp, r.salesRepName, r.amount);
    add(bySeg, r.businessSegment || r.segment || "Unassigned", r.amount);

    const main = r.mainGroup || "Unassigned";
    add(byMain, main, r.amount);
    let subs = bySub.get(main);
    if (!subs) {
      subs = new Map<string, NamedTotal>();
      bySub.set(main, subs);
    }
    add(subs, r.subGroup || "Unassigned", r.amount);

    const sub = r.subGroup || "Unassigned";
    const division = r.pcShortName || "Unassigned";
    let mainDivisions = byMainDivision.get(main);
    if (!mainDivisions) {
      mainDivisions = new Map<string, NamedTotal>();
      byMainDivision.set(main, mainDivisions);
    }
    add(mainDivisions, division, r.amount);

    let subGroups = bySubDivision.get(main);
    if (!subGroups) {
      subGroups = new Map<string, Map<string, NamedTotal>>();
      bySubDivision.set(main, subGroups);
    }
    let subDivisions = subGroups.get(sub);
    if (!subDivisions) {
      subDivisions = new Map<string, NamedTotal>();
      subGroups.set(sub, subDivisions);
    }
    add(subDivisions, division, r.amount);


    const label = r.month || (r.postingDate ? r.postingDate.slice(0, 7) : "—");
    const bucket =
      byMonth.get(label) ?? {
        month: label,
        revenue: 0,
        quantity: 0,
        ah: 0,
        docs: new Set<string>(),
        customers: new Set<string>(),
      };
    bucket.revenue += r.amount;
    bucket.quantity += r.quantity;
    bucket.ah += r.totalAh;
    if (r.docNo) bucket.docs.add(r.docNo);
    if (r.customer) bucket.customers.add(r.customer);
    byMonth.set(label, bucket);
  }

  const monthBuckets = [...byMonth.values()].sort((a, b) =>
    monthSortKey(a.month).localeCompare(monthSortKey(b.month)),
  );
  const monthly = monthBuckets.map((m) => ({
    month: m.month,
    revenue: m.revenue,
    documents: m.docs.size,
    quantity: m.quantity,
    realization: m.quantity ? m.revenue / m.quantity : 0,
  }));


  const pcList = rank(byPc);
  // Compare the latest month with the most recent earlier month that carries a
  // meaningful amount, so a nearly empty month cannot blow the percentage up.
  const withRevenue = monthly.filter((m) => m.revenue !== 0);
  const last = withRevenue[withRevenue.length - 1];
  const floor = last ? Math.abs(last.revenue) * 0.05 : 0;
  const prev = last
    ? [...withRevenue.slice(0, -1)].reverse().find((m) => Math.abs(m.revenue) >= floor)
    : undefined;
  const momPct = last && prev ? ((last.revenue - prev.revenue) / Math.abs(prev.revenue)) * 100 : null;

  const revenuePerAh = totalAh ? revenue / totalAh : 0;
  const revenuePerCustomer = customers.size ? revenue / customers.size : 0;

  // Month-on-month deltas for the management tiles, using the same pair of
  // meaningful months as the headline growth number.
  const bucketOf = (label?: string) => monthBuckets.find((m) => m.month === label);
  const lastB = bucketOf(last?.month);
  const prevB = bucketOf(prev?.month);
  const cmpLabel = lastB && prevB ? `vs ${prevB.month}` : "—";
  const pctOf = (a: number, b: number): number | null =>
    lastB && prevB && b !== 0 ? ((a - b) / Math.abs(b)) * 100 : null;
  const d = (a?: number, b?: number): Delta => ({
    pct: lastB && prevB ? pctOf(a ?? 0, b ?? 0) : null,
    label: cmpLabel,
  });
  const rate = (bkt?: { revenue: number; ah: number }) =>
    bkt && bkt.ah ? bkt.revenue / bkt.ah : 0;
  const perCust = (bkt?: { revenue: number; customers: Set<string> }) =>
    bkt && bkt.customers.size ? bkt.revenue / bkt.customers.size : 0;

  const deltas = {
    revenue: d(lastB?.revenue, prevB?.revenue),
    growth: d(lastB?.revenue, prevB?.revenue),
    quantity: d(lastB?.quantity, prevB?.quantity),
    customers: d(lastB?.customers.size, prevB?.customers.size),
    revenuePerAh: d(rate(lastB), rate(prevB)),
    revenuePerCustomer: d(perCust(lastB), perCust(prevB)),
  };

  // Customer concentration (Pareto) over the whole filtered selection. The
  // bars show only the ten largest customers, while percentages retain the
  // complete filtered customer total as their denominator.
  const custList = rank(byCust);
  const custTotal = custList.reduce((sum, c) => sum + c.value, 0);
  const cut = (n: number) => custList.slice(0, n).reduce((sum, c) => sum + c.value, 0);
  const pareto = custList.slice(0, 10).map((customer, index) => ({
    customer: customer.name,
    value: customer.value,
    contributionPct: custTotal ? (customer.value / custTotal) * 100 : 0,
    cumulativePct: custTotal ? (cut(index + 1) / custTotal) * 100 : 0,
  }));

  // Management alerts derived from the current selection.
  const segList = rank(bySeg);
  const alerts: { tone: "up" | "down" | "warn"; text: string }[] = [];
  const pct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
  if (momPct != null)
    alerts.push({
      tone: momPct >= 0 ? "up" : "down",
      text: `Sales ${momPct >= 0 ? "grew" : "declined"} ${pct(momPct)} in ${last?.month} ${cmpLabel}.`,
    });
  if (custTotal)
    alerts.push({
      tone: "warn",
      text: `Top 5 customers contribute ${((cut(5) / custTotal) * 100).toFixed(1)}% of total sales.`,
    });
  if (segList[0])
    alerts.push({
      tone: "up",
      text: `${segList[0].name} is the largest segment at ${((segList[0].value / (revenue || 1)) * 100).toFixed(1)}% of sales.`,
    });
  if (pcList[0])
    alerts.push({
      tone: "up",
      text: `${pcList[0].name} leads profit centres with ₹${(pcList[0].value / 1e7).toFixed(2)} Cr.`,
    });
  if (deltas.revenuePerAh.pct != null)
    alerts.push({
      tone: deltas.revenuePerAh.pct >= 0 ? "up" : "down",
      text: `Revenue per AH ${deltas.revenuePerAh.pct >= 0 ? "improved" : "dropped"} ${pct(deltas.revenuePerAh.pct)} ${cmpLabel}.`,
    });

  return {
    kpis: {
      revenue,
      documents: docs.size,
      lines: rows.length,
      customers: customers.size,
      avgDoc: docs.size ? revenue / docs.size : 0,
      linesPerDoc: docs.size ? rows.length / docs.size : 0,
      quantity,
      totalAh,
      positiveAhTotal,
      positiveAhSales,
      avgRealization: quantity ? revenue / quantity : 0,
      revenuePerAh,
      revenuePerCustomer,
      momPct,
      momLabel: last && prev ? `${last.month} vs ${prev.month}` : last ? last.month : "—",
      topProfitCentre: pcList[0]?.name ?? "—",
      topProfitCentreValue: pcList[0]?.value ?? 0,
    },
    deltas,
    pareto,
    alerts,

    mixByType: rank(byType),
    byNewRepl: rank(byNewRepl),
    unassignedNewReplCount,
    bySegment: rank(bySeg),
    topProfitCentres: pcList.slice(0, 10),
    monthly,
    topCustomers: rank(byCust, 10),
    topMaterials: rank(byMat, 10),
    topSalesEmployees: rank(byEmp, 10),
    modelPerformance,
    byMainGroup: rank(byMain),
    subGroupsByMainGroup: Object.fromEntries(
      [...bySub.entries()].map(([main, subs]) => [main, rank(subs)]),
    ),
    divisionsByMainGroup: Object.fromEntries(
      [...byMainDivision.entries()].map(([main, divisions]) => [main, rank(divisions)]),
    ),
    divisionsBySubGroup: Object.fromEntries(
      [...bySubDivision.entries()].map(([main, subGroups]) => [
        main,
        Object.fromEntries(
          [...subGroups.entries()].map(([sub, divisions]) => [sub, rank(divisions)]),
        ),
      ]),
    ),

    rows,
  };
}


export function uniqueValues(rows: SdLine[], pick: (r: SdLine) => string): string[] {
  return [...new Set(rows.map(pick).filter(Boolean))].sort();
}
