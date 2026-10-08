import { describe, expect, test } from "bun:test";
import { countPendingOrdersAgainstAh } from "../src/lib/open-sales-orders-table";

describe("Pending Orders Against AH", () => {
  test("counts every qualifying line, including repeated sales orders", () => {
    expect(countPendingOrdersAgainstAh([
      { order: "100", totalAh: 10 },
      { order: "100", totalAh: 20 },
      { order: "200", totalAh: 5 },
    ])).toBe(3);
  });
  test("requires Total AH strictly greater than zero, including positive decimals", () => {
    expect(countPendingOrdersAgainstAh([
      { order: "100", totalAh: 0 },
      { order: "200", totalAh: -5 },
      { order: "300", totalAh: 0.001 },
      { order: "400", totalAh: 0 },
      { order: "400", totalAh: 2.5 },
    ])).toBe(2);
  });
  test("counts only supplied Smart-Filtered rows", () => {
    const rows = [
      { order: "100", totalAh: 1, plant: "A" },
      { order: "200", totalAh: 2, plant: "B" },
      { order: "300", totalAh: 0, plant: "A" },
    ];
    expect(countPendingOrdersAgainstAh(rows)).toBe(2);
    expect(countPendingOrdersAgainstAh(rows.filter((row) => row.plant === "A"))).toBe(1);
  });
  test("returns zero for empty results", () => {
    expect(countPendingOrdersAgainstAh([])).toBe(0);
  });
});