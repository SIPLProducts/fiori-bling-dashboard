import type { OpenSalesOrder } from "./open-sales-orders-data";

export const DEFAULT_DOCUMENT_TYPES = ["ZDOR", "ZEOR", "ZSOR"];
export type OpenOrderFilters = {
  documentTypes: string[];
  customers: string[] | null;
  zones: string[] | null;
  products: string[] | null;
  divisions: string[] | null;
  plants: string[] | null;
};
export const documentTypeDescription = (row: OpenSalesOrder) => {
  const description = row.salesType?.trim();
  return description && description !== "Unassigned" ? description : row.documentType;
};
export const documentTypeKey = (row: OpenSalesOrder) => JSON.stringify([row.documentType, documentTypeDescription(row)]);
export function documentTypeOptions(rows: OpenSalesOrder[]) {
  return [...new Map(rows.map((row) => [documentTypeKey(row), {
    value: documentTypeKey(row),
    label: `${row.documentType} — ${documentTypeDescription(row)}`,
  }])).values()].sort((a, b) => a.label.localeCompare(b.label));
}
export function defaultDocumentTypeKeys(rows: OpenSalesOrder[]) {
  return [...new Set(rows.filter((row) => DEFAULT_DOCUMENT_TYPES.includes(row.documentType)).map(documentTypeKey))];
}
export function summarizeDocumentDescriptions(rows: OpenSalesOrder[]) {
  const groups = new Map<string, { name: string; count: number; value: number }>();
  for (const row of rows) {
    const name = documentTypeDescription(row);
    const group = groups.get(name) ?? { name, count: 0, value: 0 };
    group.count += 1;
    group.value += row.value;
    groups.set(name, group);
  }
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
}
export const defaultOpenOrderFilters = (rows?: OpenSalesOrder[]): OpenOrderFilters => ({
  documentTypes: rows ? defaultDocumentTypeKeys(rows) : [...DEFAULT_DOCUMENT_TYPES],
  customers: null, zones: null, products: null, divisions: null, plants: null,
});
export const productKey = (row: OpenSalesOrder) => `${row.material} — ${row.description}`;
export const customerKey = (row: OpenSalesOrder) => row.customerSoldTo || row.customer;

export function filterOpenOrders(rows: OpenSalesOrder[], filters: OpenOrderFilters, dates?: { from?: string | undefined; to?: string | undefined }) {
  return rows.filter((row) => {
    if (dates?.from || dates?.to) {
      if (!row.orderDate || !Number.isFinite(Date.parse(row.orderDate))) return false;
      if (dates.from && row.orderDate < dates.from) return false;
      if (dates.to && row.orderDate > dates.to) return false;
    }
    if (!filters.documentTypes.includes(documentTypeKey(row)) && !filters.documentTypes.includes(row.documentType)) return false;
    if (filters.customers !== null && !filters.customers.includes(customerKey(row))) return false;
    if (filters.zones !== null && !filters.zones.includes(row.zone)) return false;
    if (filters.products !== null && !filters.products.includes(productKey(row))) return false;
    if (filters.divisions !== null && !filters.divisions.includes(row.division)) return false;
    if (filters.plants !== null && !filters.plants.includes(row.plant)) return false;
    return true;
  });
}