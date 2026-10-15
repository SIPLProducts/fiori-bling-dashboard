import { describe, expect, test } from "bun:test";
import { countPendingOrdersAgainstAh } from "../src/lib/open-sales-orders-table";

describe("Pending Orders Against AH", () => {
  test("counts each sales order once even when several lines qualify", () => {
    expect(countPendingOrdersAgainstAh([
      { order: "100", totalAh: 10 },
      { order: "100", totalAh: 20 },
      { order: "200", totalAh: 5 },
    ])).toBe(2);
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

import { sumPendingAhQuantity } from "../src/lib/open-sales-orders-table";
describe("Pending AH Quantity", () => {
  test("sums the Total AH column across rows", () => {
    expect(sumPendingAhQuantity([{ totalAh: 10 }, { totalAh: 20.5 }, { totalAh: 0 }])).toBe(30.5);
  });
  test("returns zero for empty results", () => {
    expect(sumPendingAhQuantity([])).toBe(0);
  });
});

import { formatPendingAhQuantityInLakhs } from "../src/lib/open-sales-orders-table";
describe("Pending AH Quantity in LAH", () => {
  test("divides the Total AH sum by one lakh with two decimals", () => {
    expect(formatPendingAhQuantityInLakhs(1107400)).toBe("11.07 LAH");
    expect(formatPendingAhQuantityInLakhs(123456)).toBe("1.23 LAH");
  });
  test("keeps small quantities visible as decimal LAH", () => {
    expect(formatPendingAhQuantityInLakhs(500)).toBe("0.01 LAH");
  });
  test("shows zero LAH for an empty result", () => {
    expect(formatPendingAhQuantityInLakhs(0)).toBe("0.00 LAH");
  });
});
