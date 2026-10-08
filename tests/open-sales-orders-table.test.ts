import { describe, expect, test } from "bun:test";
import type { OpenSalesOrder } from "../src/lib/open-sales-orders-data";
import { filterOpenOrderTable } from "../src/lib/open-sales-orders-table";

const base = { order: "1027671", item: "150", customer: "A K Steels", documentType: "ZDOR", zone: "South Zone", division: "10", plant: "1100", plantName: "Hyderabad Works", material: "8000000026", description: "Battery Pack", orderDate: "2026-04-15", deliveryDate: "2026-05-20", daysOpen: 174, openQuantity: 170480, deliveredQuantity: 0, value: 4.023 };
const rows = Array.from({ length: 25 }, (_, index) => ({ ...base, order: String(1027671 + index), deliveredQuantity: index % 2 === 0 ? 0 : 20 }) as OpenSalesOrder);

describe("Open Sales Orders table filters", () => {
  test("filters statuses without dropping or changing all rows", () => {
    expect(filterOpenOrderTable(rows, "all", "")).toHaveLength(25);
    expect(filterOpenOrderTable(rows, "open", "")).toHaveLength(13);
    expect(filterOpenOrderTable(rows, "partial", "")).toHaveLength(12);
  });
  test("searches every displayed data field with formatted and raw values", () => {
    for (const search of ["150", "a k STEELS", "zdor", "South", "10", "1100", "hyderabad", "8000000026", "battery", "2026-04-15", "15-Apr-2026", "20-May-2026", "174", "170480", "1,70,480", "4.02", "4.023", "Open"]) {
      expect(filterOpenOrderTable(rows, "open", search)).toHaveLength(13);
    }
  });
  test("combines search and status across rows beyond page one", () => {
    expect(filterOpenOrderTable(rows, "all", "1027695")).toHaveLength(1);
    expect(filterOpenOrderTable(rows, "partial", "partially delivered")).toHaveLength(12);
    expect(filterOpenOrderTable(rows, "open", "partially delivered")).toHaveLength(0);
    expect(filterOpenOrderTable(rows, "all", "no such product")).toHaveLength(0);
    expect(filterOpenOrderTable(rows, "all", "   ")).toHaveLength(25);
  });
});