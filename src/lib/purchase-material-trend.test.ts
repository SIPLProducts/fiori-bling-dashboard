import { describe, expect, it } from "vitest";
import { materialTrends } from "./purchase-material-trend";
import type { PurchaseRow } from "./purchase-register-data";

const row = (material: string, date: string, rate: number, qty = 10): PurchaseRow => ({
  date, plant: "P", plantName: "P", profitCenter: "", profitCenterName: "", vendor: "V", vendorName: "V",
  material, materialName: material, group: "G", type: "Domestic", value: (rate * qty) / 1e7, qty, unit: "NOS", rate,
});
const series = (m: string, rates: number[]) => rates.map((r, i) => row(m, `2026-04-${String(i + 1).padStart(2, "0")}`, r));

describe("materialTrends", () => {
  it("ignores materials bought fewer than 5 times", () => {
    expect(materialTrends(series("A", [10, 12, 14, 16])).rising).toHaveLength(0);
  });
  it("includes a steady rise and reports first/latest rate", () => {
    const t = materialTrends(series("A", [10, 11, 12, 13, 15])).rising[0]!;
    expect(t.firstRate).toBe(10); expect(t.lastRate).toBe(15); expect(t.changePct).toBe(50);
  });
  it("includes a steady fall", () => {
    expect(materialTrends(series("B", [20, 19, 18, 17, 16])).falling[0]?.material).toBe("B");
  });
  it("excludes zig-zag prices", () => {
    const r = materialTrends(series("C", [10, 15, 9, 16, 8, 17]));
    expect(r.rising).toHaveLength(0); expect(r.falling).toHaveLength(0);
  });
  it("excludes jumps over 1000%", () => {
    const r = materialTrends(series("D", [1, 2, 4, 8, 20]));
    expect(r.rising).toHaveLength(0); expect(r.outliers).toBe(1);
  });
});
