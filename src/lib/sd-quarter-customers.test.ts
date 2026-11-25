import { describe, expect, it } from "vitest";
import { topCustomersByQuarter } from "./sd-quarter-customers";
const r = (postingDate: string, customerName: string, amount: number) => ({ postingDate, customer: "", customerName, amount });

describe("Top 10 customers by quarter", () => {
  it("shows only quarters with data, in order", () => {
    const out = topCustomersByQuarter([r("2026-08-01", "B", 5), r("2026-04-10", "A", 3)]);
    expect(out.map((q) => q.label)).toEqual(["QTR 1", "QTR 2"]);
  });
  it("Jan–Mar is QTR 4 of the same FY", () => {
    expect(topCustomersByQuarter([r("2026-04-01", "A", 1), r("2027-02-01", "A", 1)]).map((q) => q.label)).toEqual(["QTR 1", "QTR 4"]);
  });
  it("ranks customers by net sales within a quarter, max 10", () => {
    const rows = Array.from({ length: 12 }, (_, i) => r("2026-05-01", `C${i}`, i));
    const q = topCustomersByQuarter([...rows, r("2026-05-02", "C0", 100)])[0]!;
    expect(q.items).toHaveLength(10);
    expect(q.items[0]).toMatchObject({ name: "C0", value: 100 });
  });
  it("adds FY to labels when several years are shown", () => {
    expect(topCustomersByQuarter([r("2025-05-01", "A", 1), r("2026-05-01", "A", 1)]).map((q) => q.label)).toEqual(["QTR 1 FY26", "QTR 1 FY27"]);
  });
});
