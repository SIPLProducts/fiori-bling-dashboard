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
  "doc_no, doc_item, posting_date, month, fiscal_year, plant, gl, gl_name, company_code, customer, customer_name, customer_profile, profit_ctr, profit_ctr_name, pc_short_name, main_group, sub_group, new_repl, sales_type, segment, material, material_desc, product_group, model, product_range, product_type, division_name, industry_name, country_name, sales_order, sales_zone, sales_rep_name, incoterms, usage_desc, unit, quantity, total_ah, amount";

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
  search: string;
};

export const emptySdFilters: SdFilters = {
  from: "",
  to: "",
  plants: [],
  profitCentres: [],
  search: "",
};

export function applySdFilters(rows: SdLine[], f: SdFilters): SdLine[] {
  const term = f.search.trim().toLowerCase();
  const inList = (list: string[], value: string) => !list.length || list.includes(value);
  return rows.filter((r) => {
    if (f.from && r.postingDate && r.postingDate < f.from) return false;
    if (f.to && r.postingDate && r.postingDate > f.to) return false;
    if (!inList(f.plants, r.plant)) return false;
    if (!inList(f.profitCentres, r.profitCtr)) return false;
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

export type SdAnalytics = {
  kpis: {
    revenue: number;
    documents: number;
    lines: number;
    customers: number;
    avgDoc: number;
    linesPerDoc: number;
    quantity: number;
    avgRealization: number;
    momPct: number | null;
    momLabel: string;
    topProfitCentre: string;
    topProfitCentreValue: number;
  };
  mixByType: NamedTotal[];
  bySegment: NamedTotal[];
  monthly: {
    month: string;
    revenue: number;
    documents: number;
    quantity: number;
    realization: number;
  }[];
  topCustomers: NamedTotal[];
  topMaterials: NamedTotal[];
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
  const byMonth = new Map<
    string,
    { month: string; revenue: number; quantity: number; docs: Set<string> }
  >();

  const docs = new Set<string>();
  const customers = new Set<string>();
  let revenue = 0;
  let quantity = 0;

  for (const r of rows) {
    revenue += r.amount;
    quantity += r.quantity;
    if (r.docNo) docs.add(`${r.fiscalYear}/${r.docNo}`);
    if (r.customer) customers.add(r.customer);
    add(byType, r.salesType, r.amount);
    add(byPc, r.pcShortName || r.profitCtrName || r.profitCtr, r.amount);
    add(byCust, r.customerName || r.customer, r.amount);
    add(byMat, r.materialDesc || r.material, r.amount);

    const label = r.month || (r.postingDate ? r.postingDate.slice(0, 7) : "—");
    const bucket =
      byMonth.get(label) ?? { month: label, revenue: 0, quantity: 0, docs: new Set<string>() };
    bucket.revenue += r.amount;
    bucket.quantity += r.quantity;
    if (r.docNo) bucket.docs.add(r.docNo);
    byMonth.set(label, bucket);
  }

  const monthly = [...byMonth.values()]
    .sort((a, b) => monthSortKey(a.month).localeCompare(monthSortKey(b.month)))
    .map((m) => ({
      month: m.month,
      revenue: m.revenue,
      documents: m.docs.size,
      quantity: m.quantity,
      realization: m.quantity ? m.revenue / m.quantity : 0,
    }));

  const pcList = rank(byPc);
  const last = monthly[monthly.length - 1];
  const prev = monthly[monthly.length - 2];
  const momPct = last && prev && prev.revenue ? ((last.revenue - prev.revenue) / Math.abs(prev.revenue)) * 100 : null;

  return {
    kpis: {
      revenue,
      documents: docs.size,
      lines: rows.length,
      customers: customers.size,
      avgDoc: docs.size ? revenue / docs.size : 0,
      linesPerDoc: docs.size ? rows.length / docs.size : 0,
      quantity,
      avgRealization: quantity ? revenue / quantity : 0,
      momPct,
      momLabel: last ? `${last.month}${prev ? ` vs ${prev.month}` : ""}` : "—",
      topProfitCentre: pcList[0]?.name ?? "—",
      topProfitCentreValue: pcList[0]?.value ?? 0,
    },
    mixByType: rank(byType),
    monthly,
    topCustomers: rank(byCust, 10),
    topMaterials: rank(byMat, 5),
    rows,
  };
}


export function uniqueValues(rows: SdLine[], pick: (r: SdLine) => string): string[] {
  return [...new Set(rows.map(pick).filter(Boolean))].sort();
}
