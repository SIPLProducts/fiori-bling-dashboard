import { supabase } from "@/integrations/supabase/client";

/** One document line from zfisales_detail, client-safe. */
export type SdLine = {
  docNo: string;
  postingDate: string;
  month: string;
  fiscalYear: string;
  plant: string;
  companyCode: string;
  customer: string;
  customerName: string;
  profitCtr: string;
  profitCtrName: string;
  salesType: string;
  segment: string;
  material: string;
  materialDesc: string;
  productGroup: string;
  countryName: string;
  salesOrder: string;
  unit: string;
  quantity: number;
  amount: number;
};

const COLUMNS =
  "doc_no, posting_date, month, fiscal_year, plant, company_code, customer, customer_name, profit_ctr, profit_ctr_name, sales_type, segment, material, material_desc, product_group, country_name, sales_order, unit, quantity, amount";

const PAGE = 1000;

export async function fetchSdLines(): Promise<SdLine[]> {
  const rows: SdLine[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("zfisales_detail")
      .select(COLUMNS)
      .order("posting_date", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    for (const r of data ?? []) {
      rows.push({
        docNo: r.doc_no ?? "",
        postingDate: r.posting_date ?? "",
        month: r.month ?? "",
        fiscalYear: r.fiscal_year ?? "",
        plant: r.plant ?? "",
        companyCode: r.company_code ?? "",
        customer: r.customer ?? "",
        customerName: r.customer_name ?? "",
        profitCtr: r.profit_ctr ?? "",
        profitCtrName: r.profit_ctr_name ?? "",
        salesType: r.sales_type ?? "",
        segment: r.segment ?? "",
        material: r.material ?? "",
        materialDesc: r.material_desc ?? "",
        productGroup: r.product_group ?? "",
        countryName: r.country_name ?? "",
        salesOrder: r.sales_order ?? "",
        unit: r.unit ?? "",
        quantity: Number(r.quantity ?? 0),
        amount: Number(r.amount ?? 0),
      });
    }
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

export type SdFilters = {
  from: string;
  to: string;
  fiscalYears: string[];
  plants: string[];
  profitCentres: string[];
  salesTypes: string[];
  segments: string[];
  productGroups: string[];
  countries: string[];
  search: string;
};

export const emptySdFilters: SdFilters = {
  from: "",
  to: "",
  fiscalYears: [],
  plants: [],
  profitCentres: [],
  salesTypes: [],
  segments: [],
  productGroups: [],
  countries: [],
  search: "",
};

export function applySdFilters(rows: SdLine[], f: SdFilters): SdLine[] {
  const term = f.search.trim().toLowerCase();
  const inList = (list: string[], value: string) => !list.length || list.includes(value);
  return rows.filter((r) => {
    if (f.from && r.postingDate && r.postingDate < f.from) return false;
    if (f.to && r.postingDate && r.postingDate > f.to) return false;
    if (!inList(f.fiscalYears, r.fiscalYear)) return false;
    if (!inList(f.plants, r.plant)) return false;
    if (!inList(f.profitCentres, r.profitCtr)) return false;
    if (!inList(f.salesTypes, r.salesType)) return false;
    if (!inList(f.segments, r.segment)) return false;
    if (!inList(f.productGroups, r.productGroup)) return false;
    if (!inList(f.countries, r.countryName)) return false;
    if (
      term &&
      ![r.docNo, r.customer, r.customerName, r.material, r.materialDesc, r.salesOrder]
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
    customers: number;
    avgDoc: number;
    quantity: number;
    topProfitCentre: string;
  };
  mixByType: NamedTotal[];
  monthly: { month: string; revenue: number; documents: number }[];
  byProfitCentre: NamedTotal[];
  bySegment: NamedTotal[];
  topCustomers: NamedTotal[];
  topMaterials: NamedTotal[];
  byCountry: NamedTotal[];
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
  const bySeg = new Map<string, NamedTotal>();
  const byCust = new Map<string, NamedTotal>();
  const byMat = new Map<string, NamedTotal>();
  const byCountry = new Map<string, NamedTotal>();
  const byMonth = new Map<string, { month: string; revenue: number; docs: Set<string> }>();

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
    add(byPc, r.profitCtrName || r.profitCtr, r.amount);
    add(bySeg, r.segment, r.amount);
    add(byCust, r.customerName || r.customer, r.amount);
    add(byMat, r.materialDesc || r.material, r.amount);
    add(byCountry, r.countryName, r.amount);

    const label = r.month || (r.postingDate ? r.postingDate.slice(0, 7) : "—");
    const bucket = byMonth.get(label) ?? { month: label, revenue: 0, docs: new Set<string>() };
    bucket.revenue += r.amount;
    if (r.docNo) bucket.docs.add(r.docNo);
    byMonth.set(label, bucket);
  }

  const monthly = [...byMonth.values()]
    .sort((a, b) => monthSortKey(a.month).localeCompare(monthSortKey(b.month)))
    .map((m) => ({ month: m.month, revenue: m.revenue, documents: m.docs.size }));

  const pcList = rank(byPc);

  return {
    kpis: {
      revenue,
      documents: docs.size,
      customers: customers.size,
      avgDoc: docs.size ? revenue / docs.size : 0,
      quantity,
      topProfitCentre: pcList[0]?.name ?? "—",
    },
    mixByType: rank(byType),
    monthly,
    byProfitCentre: pcList.slice(0, 10),
    bySegment: rank(bySeg, 8),
    topCustomers: rank(byCust, 10),
    topMaterials: rank(byMat, 10),
    byCountry: rank(byCountry, 10),
    rows,
  };
}

export function uniqueValues(rows: SdLine[], pick: (r: SdLine) => string): string[] {
  return [...new Set(rows.map(pick).filter(Boolean))].sort();
}
