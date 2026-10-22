export type CashTransaction = {
  id: string; date: string; plant: string; profitCentre: string; glCode: string;
  pcGroup: string; classification: string; nature: string; year: string; quarter: string;
  credit: number; debit: number;
  profitCentreName?: string; glName?: string; net?: number; collectionDisbursement?: string;
};
export type ZcashFlowDbRow = {
  id: string; plant: string | null; profit_center: string | null; profit_center_name: string | null;
  gl_code: string | null; gl_name: string | null; profit_center_group: string | null;
  classification: string | null; nature: string | null; debit: number | string | null;
  credit: number | string | null; net: number | string | null; collection_disbursement: string | null;
};
const n = (v: unknown) => { const x = Number(v ?? 0); return Number.isFinite(x) ? x : 0; };
/** Converts a stored ZCASH_FLOW row; SAP sends no date, so year/quarter stay empty. */
export function mapZcashRow(r: ZcashFlowDbRow): CashTransaction {
  return {
    id: r.id, date: "", year: "", quarter: "",
    plant: r.plant ?? "", profitCentre: r.profit_center ?? "", profitCentreName: r.profit_center_name ?? "",
    glCode: r.gl_code ?? "", glName: r.gl_name ?? "", pcGroup: r.profit_center_group ?? "",
    classification: r.classification ?? "", nature: r.nature ?? "",
    credit: n(r.credit), debit: n(r.debit), net: n(r.net), collectionDisbursement: r.collection_disbursement ?? "",
  };
}
export const rowNet = (r: CashTransaction) => r.net ?? r.credit - r.debit;
export const CASH_FILTERS = [
  ["plant", "Plant"], ["profitCentre", "Profit Centre (PC)"], ["glCode", "GL Code"],
  ["pcGroup", "PC Group"], ["classification", "Classification"], ["nature", "Nature"],
  ["year", "Year"], ["quarter", "Quarter"],
] as const;
export type CashFilterKey = typeof CASH_FILTERS[number][0];
export type CashFilters = Partial<Record<CashFilterKey, string[] | null>>;
export const CRORE = 10_000_000;
const centres = ["PC-East", "PC-South", "PC-West", "PC-Central"];
const groups = ["Corporate", "Retail", "Logistics"];
const classifications = ["Operating", "Investing", "Financing"];

function createSamples(): CashTransaction[] {
  const rows: CashTransaction[] = [];
  for (let month = 0; month < 12; month++) {
    for (let gl = 0; gl < 185; gl++) {
      const type = gl % 3;
      rows.push({
        id: `${month}-${gl}`, date: `2026-${String(month + 1).padStart(2, "0")}-${String(gl % 27 + 1).padStart(2, "0")}`,
        plant: `PL-${String(gl % 42 + 1).padStart(2, "0")}`, profitCentre: centres[gl % 4] ?? "PC-East",
        glCode: `GL-${41002 + gl}`, pcGroup: groups[type] ?? "Corporate",
        classification: classifications[type] ?? "Operating", nature: ["Revenue", "Machinery", "Borrowing"][type] ?? "Revenue",
        year: "2026", quarter: `Q${Math.floor(month / 3) + 1}`,
        credit: gl % 5 === 0 ? 0 : (gl % 13 + 5) * (month % 5 + 7),
        debit: gl % 7 === 0 ? 0 : (gl % 11 + 4) * ((month + 2) % 5 + 5),
      });
    }
  }
  const credits = rows.reduce((sum, row) => sum + row.credit, 0);
  const debits = rows.reduce((sum, row) => sum + row.debit, 0);
  return rows.map(row => ({ ...row, credit: row.credit / credits * 4892.4 * CRORE, debit: row.debit / debits * 3651.55 * CRORE }));
}
export const CASH_SAMPLE_ROWS = createSamples();
export function filterCashRows(rows: CashTransaction[], filters: CashFilters) {
  return rows.filter(row => CASH_FILTERS.every(([key]) => {
    const selected = filters[key];
    if (!selected) return true; // null/undefined = unrestricted
    if (!selected.length) return false; // empty array = none selected
    return selected.includes(row[key]);
  }));
}
export function searchCashLedger(rows: CashTransaction[], search: string) {
  const term = search.trim().toLowerCase();
  return rows.filter(row => !term || Object.values(row).some(value => String(value).toLowerCase().includes(term)));
}
export function cashTotals(rows: CashTransaction[]) {
  const credit = rows.reduce((sum, row) => sum + row.credit, 0);
  const debit = rows.reduce((sum, row) => sum + row.debit, 0);
  return { credit, debit, net: rows.reduce((sum, row) => sum + rowNet(row), 0), plants: new Set(rows.map(row => row.plant)).size, gls: new Set(rows.map(row => row.glCode)).size };
}
export function cashTrend(rows: CashTransaction[], quarterly: boolean) {
  const map = new Map<string, { name: string; credit: number; debit: number; net: number }>();
  for (const row of rows) {
    if (!row.date) continue;
    const key = quarterly ? `${row.year}-${row.quarter}` : row.date.slice(0, 7);
    const name = quarterly ? row.quarter : new Date(`${key}-01T00:00:00Z`).toLocaleString("en", { month: "short", timeZone: "UTC" });
    const entry = map.get(key) ?? { name, credit: 0, debit: 0, net: 0 };
    entry.credit += row.credit / CRORE; entry.debit += row.debit / CRORE;
    entry.net = entry.credit - entry.debit; map.set(key, entry);
  }
  return [...map].sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value);
}
export function cashPlantGroups(rows: CashTransaction[]) {
  const map = new Map<string, Record<string, number | string>>();
  rows.forEach(row => {
    const entry = map.get(row.plant) ?? { name: row.plant };
    entry[row.profitCentre] = Number(entry[row.profitCentre] ?? 0) + row.credit / CRORE;
    map.set(row.plant, entry);
  });
  return [...map.values()];
}
export function cashComposition(rows: CashTransaction[], key: "classification" | "pcGroup") {
  const map = new Map<string, number>();
  rows.forEach(row => map.set(row[key], (map.get(row[key]) ?? 0) + (row.credit + row.debit) / CRORE));
  return [...map].map(([name, value]) => ({ name, value }));
}
export async function downloadCashLedger(rows: CashTransaction[]) {
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("Cash Flow");
  sheet.addRow(["Plant", "Profit Centre", "Profit Centre Name", "PC Group", "GL Code", "GL Name", "Classification", "Nature", "Collection/Disbursement", "Credit (₹)", "Debit (₹)", "Net Balance"]);
  rows.forEach(row => sheet.addRow([row.plant, row.profitCentre, row.profitCentreName ?? "", row.pcGroup, row.glCode, row.glName ?? "", row.classification, row.nature, row.collectionDisbursement ?? "", row.credit, row.debit, rowNet(row)]));
  sheet.columns.forEach(column => { column.width = 22; });
  [10, 11, 12].forEach(index => { sheet.getColumn(index).numFmt = '#,##0.00;[Red]-#,##0.00'; });
  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const link = document.createElement("a"); link.href = url; link.download = datedFileName("Cash Flow", "xlsx"); link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}/** Sums every filtered/searched ledger row, independent of pagination. */
export function cashLedgerTotals(rows: CashTransaction[]) {
  return rows.reduce((t, r) => ({ credit: t.credit + r.credit, debit: t.debit + r.debit, net: t.net + rowNet(r) }), { credit: 0, debit: 0, net: 0 });
}
/** Launchpad summary: signed Credit/Debit/Net totals with bar shares relative to the largest magnitude. */
export function summarizeCashLaunch(rows: CashTransaction[]) {
  const t = cashTotals(rows);
  const max = Math.max(Math.abs(t.credit), Math.abs(t.debit), Math.abs(t.net)) || 1;
  const bars = (["credit", "debit", "net"] as const).map(key => ({ key, value: t[key], share: Math.abs(t[key]) / max * 100 }));
  return { ...t, records: rows.length, bars };
}
