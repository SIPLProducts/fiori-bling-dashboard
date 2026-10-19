import { expect, test } from "bun:test";
import { summarizeLaunchOrders } from "../src/lib/open-orders-launch-summary";

test("every supplied order line counts and shared descriptions combine across codes", () => {
  const summary = summarizeLaunchOrders([
    { sales_type: "Domestic Sales", order_type: "ZDOR", p_value1: 100 },
    { sales_type: "Domestic Sales", order_type: "ZSOR", p_value1: "250" },
    { sales_type: "Export Sales", order_type: "ZEOR", p_value1: 150 },
  ]);
  expect(summary.count).toBe(3);
  expect(summary.openValue).toBe(500);
  expect(summary.breakdown).toEqual([
    { name: "Domestic Sales", count: 2, value: 350, share: 70 },
    { name: "Export Sales", count: 1, value: 150, share: 30 },
  ]);
});

test("top three plus Others preserves every count and stored value", () => {
  const summary = summarizeLaunchOrders([500, 400, 300, 200, 100].map((value, i) => ({
    sales_type: `Type ${i}`, order_type: "ZDOR", p_value1: value,
  })));
  expect(summary.breakdown.map((group) => group.name)).toEqual(["Type 0", "Type 1", "Type 2", "Others"]);
  expect(summary.breakdown[3]?.count).toBe(2);
  expect(summary.breakdown[3]?.value).toBe(300);
  expect(summary.breakdown.reduce((sum, group) => sum + group.count, 0)).toBe(5);
  expect(summary.breakdown.reduce((sum, group) => sum + group.value, 0)).toBe(1500);
});

test("missing descriptions use document codes and zero totals have safe widths", () => {
  const summary = summarizeLaunchOrders([
    { sales_type: "Unassigned", order_type: "ZDOR", p_value1: 0 },
    { sales_type: " ", order_type: "ZSOR", p_value1: null },
  ]);
  expect(summary.breakdown).toEqual([
    { name: "ZDOR", count: 1, value: 0, share: 0 },
    { name: "ZSOR", count: 1, value: 0, share: 0 },
  ]);
  expect(summarizeLaunchOrders([])).toEqual({ count: 0, openValue: 0, breakdown: [] });
});

test("all-date totals include older FY and nonpreset document types", () => {
  const rows = [
    { order_date: "2024-04-01", sales_type: "Older", order_type: "ZNEW", p_value1: 10_000_000 },
    { order_date: "2026-10-10", sales_type: "Domestic", order_type: "ZDOR", p_value1: 2_572_907.4 },
    { order_date: null, sales_type: "Undated", order_type: "OTHER", p_value1: 0 },
  ];
  const summary = summarizeLaunchOrders(rows);
  expect(summary.count).toBe(3);
  expect(summary.openValue).toBe(12_572_907.4);
  expect(summary.breakdown.reduce((sum, group) => sum + group.count, 0)).toBe(3);
  expect(summary.breakdown.reduce((sum, group) => sum + group.value, 0)).toBe(12_572_907.4);
});

describe("order book launch summary by code", () => {
  it("groups by order type and keeps every group without Others", () => {
    const r = summarizeLaunchOrders([
      { p_value1: 10, sales_type: "Domestic Sales", order_type: "ZDOR" },
      { p_value1: 5, sales_type: "SEZ Sales", order_type: "ZDOR" },
      { p_value1: 3, sales_type: "Domestic Sales", order_type: "ZSOR" },
      { p_value1: 2, sales_type: "Export Sales", order_type: "ZEOR" },
      { p_value1: 1, sales_type: "Export Sales", order_type: "ZSOR" },
    ], { byCode: true, all: true });
    expect(r.breakdown.map((g) => [g.name, g.value])).toEqual([["ZDOR", 15], ["ZSOR", 4], ["ZEOR", 2]]);
  });
});
