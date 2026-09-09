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
  totalAh: number;
  amount: number;
};

const COLUMNS =
  "doc_no, doc_item, posting_date, month, fiscal_year, plant, gl, gl_name, company_code, customer, customer_name, customer_profile, profit_ctr, profit_ctr_name, pc_short_name, main_group, sub_group, new_repl, sales_type, segment, material, material_desc, product_group, model, product_range, product_type, division_name, industry_name, country_name, sales_order, sales_zone, sales_rep_name, incoterms, usage_desc, unit, quantity, total_ah, amount, business_segment";

const PAGE = 1000;

type Row = Record<string, unknown>;
const s = (v: unknown) => (v == null ? "" : String(v));
const n = (v: unknown) => Number(v ?? 0);

export async function fetchSdLines(): Promise<SdLine[]> {
  const rows: SdLine[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("zfisales_detail")
      .select(COLUMNS)
      .order("posting_date", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    const page = (data ?? []) as unknown as Row[];
    for (const r of page) {
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
        totalAh: n(r["total_ah"]),
        amount: n(r["amount"]),
      });
    }
    if (page.length < PAGE) break;
  }
  return rows;
}

export type SdFilters = {
  from: string;
  to: string;
  plants: string[];
  profitCentres: string[];
  segments: string[];
  customers: string[];
  search: string;
};

export const emptySdFilters: SdFilters = {
  from: "",
  to: "",
  plants: [],
  profitCentres: [],
  segments: [],
  customers: [],
  search: "",
};

export function applySdFilters(rows: SdLine[], f: SdFilters): SdLine[] {
  const term = f.search.trim().toLowerCase();
  const inList = (list: string[], value: string) => !list.length || list.includes(value);
  return rows.filter((r) => {
    if (f.from && r.postingDate && r.postingDate < f.from) return false;
    if (f.to && r.postingDate && r.postingDate > f.to) return false;
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
  pareto: { bucket: string; value: number; cumulativePct: number }[];
  alerts: { tone: "up" | "down" | "warn"; text: string }[];
  mixByType: NamedTotal[];
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
  byMainGroup: NamedTotal[];
  subGroupsByMainGroup: Record<string, NamedTotal[]>;
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
  const byPc = new Map<string, NamedTotal>();
  const byCust = new Map<string, NamedTotal>();
  const byMat = new Map<string, NamedTotal>();
  const byEmp = new Map<string, NamedTotal>();
  const bySeg = new Map<string, NamedTotal>();
  const byMain = new Map<string, NamedTotal>();
  const bySub = new Map<string, Map<string, NamedTotal>>();
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

  for (const r of rows) {
    revenue += r.amount;
    quantity += r.quantity;
    totalAh += r.totalAh;
    if (r.docNo) docs.add(`${r.fiscalYear}/${r.docNo}`);
    if (r.customer) customers.add(r.customer);
    add(byType, r.salesType, r.amount);
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

  // Customer concentration (Pareto) over the whole filtered selection.
  const custList = rank(byCust);
  const custTotal = custList.reduce((sum, c) => sum + c.value, 0);
  const cut = (n: number) => custList.slice(0, n).reduce((sum, c) => sum + c.value, 0);
  const buckets = [10, 20, 30, 50, 100].filter((n) => n <= Math.max(custList.length, 10));
  const pareto = buckets.map((n) => ({
    bucket: `Top ${n}`,
    value: cut(n) - cut(buckets[buckets.indexOf(n) - 1] ?? 0),
    cumulativePct: custTotal ? (cut(n) / custTotal) * 100 : 0,
  }));
  const covered = buckets.length ? cut(buckets[buckets.length - 1]!) : 0;
  if (custTotal - covered > 0)
    pareto.push({ bucket: "Others", value: custTotal - covered, cumulativePct: 100 });

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
    bySegment: rank(bySeg),
    topProfitCentres: pcList.slice(0, 10),
    monthly,
    topCustomers: rank(byCust, 10),
    topMaterials: rank(byMat, 10),
    topSalesEmployees: rank(byEmp, 10),
    byMainGroup: rank(byMain),
    subGroupsByMainGroup: Object.fromEntries(
      [...bySub.entries()].map(([main, subs]) => [main, rank(subs)]),
    ),

    rows,
  };
}


export function uniqueValues(rows: SdLine[], pick: (r: SdLine) => string): string[] {
  return [...new Set(rows.map(pick).filter(Boolean))].sort();
}
