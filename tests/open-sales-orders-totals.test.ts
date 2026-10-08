import { describe, expect, test } from "bun:test";
import { filterOpenOrderTable, summarizeOpenOrderTable } from "../src/lib/open-sales-orders-table";
import type { OpenSalesOrder } from "../src/lib/open-sales-orders-data";

describe("Detailed table totals", () => {
  const rows = Array.from({ length: 25 }, (_, index) => ({ order: String(index), deliveredQuantity: index % 2 ? 2 : 0, openQuantity: 1.25, ah: 0.125, totalAh: 2.5, value: 0.01 }) as OpenSalesOrder);
  test("sums all five fields across pages without scaling decimals", () => {
    const totals = summarizeOpenOrderTable(rows);
    expect(totals.openQuantity).toBe(31.25);
    expect(totals.deliveredQuantity).toBe(24);
    expect(totals.ah).toBe(3.125);
    expect(totals.totalAh).toBe(62.5);
    expect(totals.value).toBeCloseTo(0.25);
    expect(summarizeOpenOrderTable(rows.slice(0, 10)).openQuantity).not.toBe(totals.openQuantity);
  });
  test("uses status-filtered subsets and returns zeros for no rows", () => {
    expect(summarizeOpenOrderTable(filterOpenOrderTable(rows, "partial", "")).openQuantity).toBe(15);
    expect(summarizeOpenOrderTable(filterOpenOrderTable(rows, "open", "")).ah).toBe(1.625);
    expect(summarizeOpenOrderTable([])).toEqual({ openQuantity: 0, deliveredQuantity: 0, ah: 0, totalAh: 0, value: 0 });
  });
});