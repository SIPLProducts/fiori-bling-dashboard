import { describe, expect, it } from "vitest";
import { buildOrderBookQuarters, filterByFiscalPeriod } from "@/lib/order-book-quarters";

const rows = [
  { order: "A", orderDate: "2026-04-10", value: 100 },
  { order: "A", orderDate: "2026-04-10", value: 50 },
  { order: "B", orderDate: "2026-07-05", value: 200 },
  { order: "C", orderDate: "2026-02-01", value: 999 },
];

describe("order book quarters", () => {
  it("filters by April–March financial year using created date", () => {
    expect(filterByFiscalPeriod(rows, ["2026"], []).map((r) => r.order)).toEqual(["A", "A", "B"]);
    expect(filterByFiscalPeriod(rows, ["2025"], []).map((r) => r.order)).toEqual(["C"]);
  });
  it("sums quarter value and counts distinct orders", () => {
    const active = filterByFiscalPeriod(rows, ["2026"], []);
    const q = buildOrderBookQuarters(active, rows, ["2026"], []);
    const q1 = q.find((s) => s.quarter === "Q1")!;
    expect(q1.amount).toBe(150);
    expect(q1.recordCount).toBe(1);
    expect(q.find((s) => s.quarter === "Q2")!.amount).toBe(200);
  });
});
