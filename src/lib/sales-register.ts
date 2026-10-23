export type SalesRegisterRow = {
  billingDate: string;
  billingDocument: string;
  invoiceNo: string;
  customer: string;
  customerName: string;
  plant: string;
  profitCenter: string;
  mainGroup: string;
  subGroup: string;
  productCategory: string;
  channel: string;
  material: string;
  billedQty: number;
  netValue: number;
  invoiceValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  tcs: number;
  status: string;
  creationDate: string;
  channelCode: string;
  division: string;
  billingType: string;
  salesDocument: string;
  salesDocumentItem: string;
  salesOffice: string;
  materialCode: string;
  /** SAP descriptions per filter key (code → description shown as "code — desc"). */
  descs?: Partial<Record<string, string>>;
};

/** Smart Filter keys → row values. null/absent selection = unrestricted, [] = none. */
export const SALES_REGISTER_CODE_KEYS = {
  distributionChannel: (r: SalesRegisterRow) => r.channelCode,
  division: (r: SalesRegisterRow) => r.division,
  plant: (r: SalesRegisterRow) => r.plant,
  billingType: (r: SalesRegisterRow) => r.billingType,
  billingDocument: (r: SalesRegisterRow) => r.billingDocument,
  salesDocument: (r: SalesRegisterRow) => r.salesDocument,
  salesDocumentItem: (r: SalesRegisterRow) => r.salesDocumentItem,
  customer: (r: SalesRegisterRow) => r.customer,
  salesOffice: (r: SalesRegisterRow) => r.salesOffice,
  material: (r: SalesRegisterRow) => r.materialCode,
  profitCenter: (r: SalesRegisterRow) => r.profitCenter,
} as const;
export type SalesRegisterCodeKey = keyof typeof SALES_REGISTER_CODE_KEYS;
export type SalesRegisterDateRange = { mode: "single" | "range"; from: string; to: string };
export type SalesRegisterFilterState = {
  codes: Partial<Record<SalesRegisterCodeKey, string[] | null>>;
  dates: Partial<Record<"billingDate" | "billingCreationDate", SalesRegisterDateRange>>;
};
export const emptySalesRegisterFilters: SalesRegisterFilterState = { codes: {}, dates: {} };

function inRange(iso: string, d: SalesRegisterDateRange | undefined) {
  if (!d || (!d.from && !d.to)) return true;
  if (d.mode === "single") return !d.from || iso === d.from;
  return (!d.from || iso >= d.from) && (!d.to || iso <= d.to);
}

export function filterSalesRegister(rows: SalesRegisterRow[], f: SalesRegisterFilterState): SalesRegisterRow[] {
  const sets = (Object.entries(f.codes) as [SalesRegisterCodeKey, string[] | null | undefined][])
    .filter(([, v]) => Array.isArray(v)).map(([k, v]) => [SALES_REGISTER_CODE_KEYS[k], new Set(v!)] as const);
  return rows.filter((r) => sets.every(([get, set]) => set.has(get(r)))
    && inRange(r.billingDate, f.dates.billingDate) && inRange(r.creationDate, f.dates.billingCreationDate));
}

export function salesRegisterOptions(rows: SalesRegisterRow[], key: SalesRegisterCodeKey): string[] {
  const get = SALES_REGISTER_CODE_KEYS[key];
  return [...new Set(rows.map(get).filter(Boolean))].sort();
}

/** Dropdown options as "code — description" (code alone when SAP sends no description). */
export function salesRegisterOptionLabels(rows: SalesRegisterRow[], key: SalesRegisterCodeKey): { value: string; label: string }[] {
  const get = SALES_REGISTER_CODE_KEYS[key];
  const m = new Map<string, string>();
  for (const r of rows) { const c = get(r); if (!c) continue; const d = r.descs?.[key]; if (!m.has(c) || (d && m.get(c) === c)) m.set(c, d && d !== c ? `${c} — ${d}` : c); }
  return [...m].sort(([a], [b]) => a.localeCompare(b)).map(([value, label]) => ({ value, label }));
}

export type Named = { name: string; value: number };

function rollup(rows: SalesRegisterRow[], pick: (r: SalesRegisterRow) => string): Named[] {
  const m = new Map<string, number>();
  for (const r of rows) m.set(pick(r) || "Unassigned", (m.get(pick(r) || "Unassigned") ?? 0) + r.invoiceValue);
  return [...m].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export function buildSalesRegister(rows: SalesRegisterRow[]) {
  const daily = new Map<string, { date: string; invoice: number; net: number }>();
  const tax = new Map<string, { week: string; cgst: number; sgst: number; igst: number; tcs: number }>();
  for (const r of rows) {
    const d = daily.get(r.billingDate) ?? { date: r.billingDate, invoice: 0, net: 0 };
    d.invoice += r.invoiceValue; d.net += r.netValue; daily.set(r.billingDate, d);
    const wk = r.billingDate.slice(0, 7) + "-W" + Math.ceil(Number(r.billingDate.slice(8, 10) || 1) / 7);
    const t = tax.get(wk) ?? { week: wk, cgst: 0, sgst: 0, igst: 0, tcs: 0 };
    t.cgst += r.cgst; t.sgst += r.sgst; t.igst += r.igst; t.tcs += r.tcs; tax.set(wk, t);
  }
  return {
    totalInvoice: rows.reduce((s, r) => s + r.invoiceValue, 0),
    totalNet: rows.reduce((s, r) => s + r.netValue, 0),
    customers: new Set(rows.map((r) => r.customer)).size,
    documents: new Set(rows.map((r) => r.billingDocument)).size,
    byPlant: rollup(rows, (r) => (r.descs?.plant ? `${r.plant} ${r.descs.plant}` : r.plant)).slice(0, 10),
    topCustomers: rollup(rows, (r) => r.customerName).slice(0, 10),
    byMainGroup: rollup(rows, (r) => r.mainGroup),
    byChannel: rollup(rows, (r) => r.channel),
    byCategory: rollup(rows, (r) => r.productCategory).slice(0, 10),
    daily: [...daily.values()].sort((a, b) => a.date.localeCompare(b.date)),
    tax: [...tax.values()].sort((a, b) => a.week.localeCompare(b.week)),
    dateRange: rows.length ? { from: rows.reduce((m, r) => (r.billingDate < m ? r.billingDate : m), rows[0]!.billingDate), to: rows.reduce((m, r) => (r.billingDate > m ? r.billingDate : m), rows[0]!.billingDate) } : null,
  };
}

/** Rows for the division-stacked group charts; value in ₹ Cr, order = billing document. */
export function salesRegisterGroupRows(rows: SalesRegisterRow[], group: "mainGroup" | "subGroup") {
  return rows.map((r) => ({ name: r[group], value: r.invoiceValue / 1e7, order: r.billingDocument, division: r.descs?.division || r.productCategory || r.division }));
}
