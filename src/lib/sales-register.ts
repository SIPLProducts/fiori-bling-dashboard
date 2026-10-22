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
};

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
    byPlant: rollup(rows, (r) => r.plant).slice(0, 10),
    topCustomers: rollup(rows, (r) => r.customerName).slice(0, 10),
    byMainGroup: rollup(rows, (r) => r.mainGroup),
    byChannel: rollup(rows, (r) => r.channel),
    byCategory: rollup(rows, (r) => r.productCategory),
    daily: [...daily.values()].sort((a, b) => a.date.localeCompare(b.date)),
    tax: [...tax.values()].sort((a, b) => a.week.localeCompare(b.week)),
    dateRange: rows.length ? { from: rows.reduce((m, r) => (r.billingDate < m ? r.billingDate : m), rows[0].billingDate), to: rows.reduce((m, r) => (r.billingDate > m ? r.billingDate : m), rows[0].billingDate) } : null,
  };
}
