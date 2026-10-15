import { describe, expect, test } from "bun:test";
import { countDistinctOrders, countPendingOrdersAgainstAh } from "../src/lib/open-sales-orders-table";
import { summarizeDocumentDescriptions } from "../src/lib/open-sales-orders-filters";
import { summarizeLdStatus } from "../src/lib/open-orders-ld-status";
import { summarizePlantPending } from "../src/lib/open-sales-orders-plants";
import type { OpenSalesOrder } from "../src/lib/open-sales-orders-data";

const row = (overrides: Partial<OpenSalesOrder>) => ({ order: "1000", ...overrides }) as OpenSalesOrder;

describe("Order-number counting rule", () => {
  test("an order with lines in several groups counts once per group, values stay per line", () => {
    const lines = [
      row({ order: "5001", daysOpen: 100, value: 2, ldStatus: "Y", plant: "1100", plantName: "Works", openQuantity: 1, documentType: "ZDOR", salesType: "Domestic Sales" }),
      row({ order: "5001", daysOpen: 800, value: 3, ldStatus: "N", plant: "1200", plantName: "Works", openQuantity: 2, documentType: "ZDOR", salesType: "Domestic Sales" }),
      row({ order: "5002", daysOpen: 200, value: 5, ldStatus: "Y", plant: "1100", plantName: "Works", openQuantity: 3, documentType: "ZDOR", salesType: "Domestic Sales" }),
    ];
    expect(countDistinctOrders(lines.filter((line) => line.daysOpen <= 180))).toBe(1);
    expect(countDistinctOrders(lines.filter((line) => line.daysOpen > 730))).toBe(1);
    expect(countDistinctOrders(lines)).toBe(2);
    expect(summarizeLdStatus(lines).map((entry) => entry.count)).toEqual([2, 1]);
    expect(summarizeLdStatus(lines).map((entry) => entry.value)).toEqual([7, 3]);
    expect(summarizePlantPending(lines).map((plant) => plant.count)).toEqual([2, 1]);
    expect(summarizeDocumentDescriptions(lines)[0]).toEqual({ name: "Domestic Sales", count: 2, value: 10 });
    expect(countPendingOrdersAgainstAh(lines.filter((line) => line.totalAh > 0))).toBe(0);
  });
  test("Pending Orders Against AH counts orders, not lines", () => {
    const lines = [
      row({ order: "6001", totalAh: 4 }),
      row({ order: "6001", totalAh: 9 }),
      row({ order: "6002", totalAh: 0 }),
      row({ order: "6003", totalAh: 0.5 }),
    ];
    expect(countPendingOrdersAgainstAh(lines)).toBe(2);
  });
});
