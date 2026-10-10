import { describe, expect, test } from "bun:test";
import type { OpenSalesOrder } from "../src/lib/open-sales-orders-data";
import { filterOpenOrderTable, sortOpenOrdersByCreationDate } from "../src/lib/open-sales-orders-table";

const base = { order: "1027671", item: "150", customer: "A K Steels", documentType: "ZDOR", zone: "South Zone", division: "10", plant: "1100", plantName: "Hyderabad Works", material: "8000000026", description: "Battery Pack", orderDate: "2026-04-15", deliveryDate: "2026-05-20", daysOpen: 174, openQuantity: 170480, deliveredQuantity: 0, ah: 765.4321, totalAh: 98765.4321, value: 4.023 };
const rows = Array.from({ length: 25 }, (_, index) => ({ ...base, order: String(1027671 + index), deliveredQuantity: index % 2 === 0 ? 0 : 20 }) as OpenSalesOrder);

describe("Open Sales Orders table filters", () => {
  test("creation dates descend before pagination without mutating source rows", () => {
    const unsorted = Array.from({ length: 25 }, (_, index) => ({ ...base, order: String(index + 1), orderDate: `2026-04-${String(index + 1).padStart(2, "0")}` }) as OpenSalesOrder);
    const sorted = sortOpenOrdersByCreationDate(unsorted);
    expect(sorted.slice(0, 10).map((row) => row.order)).toEqual(["25", "24", "23", "22", "21", "20", "19", "18", "17", "16"]);
    expect(sorted.slice(10, 12).map((row) => row.order)).toEqual(["15", "14"]);
    expect(unsorted[0].order).toBe("1");
  });
  test("missing and invalid creation dates sort last with stable numeric order and item ties", () => {
    const input = [
      { ...base, order: "1", orderDate: "" },
      { ...base, order: "2", orderDate: "invalid" },
      { ...base, order: "10", item: "10" },
      { ...base, order: "3", item: "20" },
      { ...base, order: "3", item: "2" },
    ] as OpenSalesOrder[];
    expect(sortOpenOrdersByCreationDate(input).map((row) => `${row.order}:${row.item}`)).toEqual(["3:2", "3:20", "10:10", "1:150", "2:150"]);
  });
  test("filters statuses without dropping or changing all rows", () => {
    expect(filterOpenOrderTable(rows, "all", "")).toHaveLength(25);
    expect(filterOpenOrderTable(rows, "open", "")).toHaveLength(13);
    expect(filterOpenOrderTable(rows, "partial", "")).toHaveLength(12);
  });
  test("searches every displayed data field with formatted and raw values", () => {
    for (const search of ["150", "a k STEELS", "zdor", "South", "10", "1100", "hyderabad", "8000000026", "battery", "2026-04-15", "15.04.2026", "20.05.2026", "174", "170480", "1,70,480", "4.02", "4.023", "Open"]) {
      expect(filterOpenOrderTable(rows, "open", search)).toHaveLength(13);
    }
  });
  test("channel code and description participate in detailed search", () => {
    const records = [{ ...base, channel: "02", salesType: "Export Sales" }] as OpenSalesOrder[];
    expect(filterOpenOrderTable(records, "all", "02 — Export Sales")).toHaveLength(1);
    expect(filterOpenOrderTable(records, "all", "Domestic Sales")).toHaveLength(0);
  });
  test("combines search and status across rows beyond page one", () => {
    for (const search of ["765.4321", "98765.4321", "98,765.4321"]) {
      expect(filterOpenOrderTable(rows, "open", search)).toHaveLength(13);
    }
    expect(filterOpenOrderTable(rows, "all", "1027695")).toHaveLength(1);
    expect(filterOpenOrderTable(rows, "partial", "partially delivered")).toHaveLength(12);
    expect(filterOpenOrderTable(rows, "open", "partially delivered")).toHaveLength(0);
    expect(filterOpenOrderTable(rows, "all", "no such product")).toHaveLength(0);
    expect(filterOpenOrderTable(rows, "all", "   ")).toHaveLength(25);
  });
});