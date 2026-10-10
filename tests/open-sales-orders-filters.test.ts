import { expect, test } from "bun:test";
import { defaultOpenOrderFilters, filterOpenOrders } from "../src/lib/open-sales-orders-filters";
import { countPendingOrdersAgainstAh } from "../src/lib/open-sales-orders-table";
import type { OpenSalesOrder } from "../src/lib/open-sales-orders-data";

const rows = [
  { order: "1", orderDate: "2024-03-31", documentType: "ZDOR", totalAh: 1 },
  { order: "2", orderDate: "2025-04-01", documentType: "ZEOR", totalAh: 2 },
  { order: "3", orderDate: "2026-10-08", documentType: "ZSOR", totalAh: 3 },
  { order: "4", orderDate: "2026-10-08", documentType: "OTHER", totalAh: 4 },
  { order: "5", orderDate: "", documentType: "ZDOR", totalAh: 5 },
] as OpenSalesOrder[];

test("unrestricted opening and Reset retain exactly ZDOR ZEOR ZSOR", () => {
  expect(defaultOpenOrderFilters().documentTypes).toEqual(["ZDOR", "ZEOR", "ZSOR"]);
  expect(filterOpenOrders(rows, defaultOpenOrderFilters()).map((row) => row.order)).toEqual(["1", "2", "3", "5"]);
  expect(countPendingOrdersAgainstAh(filterOpenOrders(rows, defaultOpenOrderFilters()))).toBe(4);
});
test("From alone is an inclusive lower creation-date boundary", () => {
  expect(filterOpenOrders(rows, defaultOpenOrderFilters(), { from: "2025-04-01" }).map((row) => row.order)).toEqual(["2", "3"]);
});
test("To alone is an inclusive upper creation-date boundary", () => {
  expect(filterOpenOrders(rows, defaultOpenOrderFilters(), { to: "2025-04-01" }).map((row) => row.order)).toEqual(["1", "2"]);
});
test("reversed date boundaries cannot include orders", () => {
  expect(filterOpenOrders(rows, defaultOpenOrderFilters(), { from: "2026-10-08", to: "2025-04-01" })).toHaveLength(0);
});
test("Date Range is inclusive and excludes missing dates only when active", () => {
  expect(filterOpenOrders(rows, defaultOpenOrderFilters(), { from: "2025-04-01", to: "2026-10-08" }).map((row) => row.order)).toEqual(["2", "3"]);
});
test("clearing Date Range restores every date and preserves other filters", () => {
  const filters = { ...defaultOpenOrderFilters(), documentTypes: ["ZDOR"] };
  expect(filterOpenOrders(rows, filters, { from: "2025-04-01" })).toHaveLength(0);
  expect(filterOpenOrders(rows, filters).map((row) => row.order)).toEqual(["1", "5"]);
});
test("Reset defaults restore unrestricted non-document filters", () => {
  const changed = { ...defaultOpenOrderFilters(), plants: [] };
  expect(filterOpenOrders(rows, changed)).toHaveLength(0);
  const reset = defaultOpenOrderFilters();
  expect([reset.customers, reset.zones, reset.products, reset.divisions, reset.plants]).toEqual([null, null, null, null, null]);
  expect(filterOpenOrders(rows, reset)).toHaveLength(4);
});