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
export const defaultOpenOrderFilters = (): OpenOrderFilters => ({
  documentTypes: [...DEFAULT_DOCUMENT_TYPES],
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
    if (!filters.documentTypes.includes(row.documentType)) return false;
    if (filters.customers !== null && !filters.customers.includes(customerKey(row))) return false;
    if (filters.zones !== null && !filters.zones.includes(row.zone)) return false;
    if (filters.products !== null && !filters.products.includes(productKey(row))) return false;
    if (filters.divisions !== null && !filters.divisions.includes(row.division)) return false;
    if (filters.plants !== null && !filters.plants.includes(row.plant)) return false;
    return true;
  });
}