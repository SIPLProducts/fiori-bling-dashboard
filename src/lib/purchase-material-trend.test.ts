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

import { periodSeries, vendorSplit } from "./purchase-material-trend";
describe("periodSeries", () => {
  it("fills months without purchases as empty", () => {
    const s = periodSeries([row("A", "2026-01-05", 10), row("A", "2026-03-05", 20)], "month");
    expect(s.map((p) => p.label)).toEqual(["Jan-26", "Feb-26", "Mar-26"]);
    expect(s[1]!.rate).toBeNull(); expect(s[2]!.rate).toBe(20);
  });
  it("groups by April–March financial year", () => {
    const s = periodSeries([row("A", "2026-03-31", 10), row("A", "2026-04-01", 20)], "year");
    expect(s.map((p) => p.label)).toEqual(["FY26", "FY27"]);
  });
  it("ranks vendors by spend", () => {
    const r = [row("A", "2026-01-01", 10), { ...row("A", "2026-01-02", 50), vendorName: "W" }];
    expect(vendorSplit(r)[0]!.name).toBe("W");
  });
});

import { filterMovers, collapseEmptyPeriods } from "./purchase-material-trend";
describe("price change threshold", () => {
  const t = (changePct: number, impact: number) => ({ changePct, impact } as never);
  it("keeps 2%+ changes and drops 1% changes with small value effect", () => {
    expect(filterMovers([t(2, 0), t(-3, 0), t(1, 0.001)], 2, 500000).length).toBe(2);
  });
  it("keeps a 1% change whose value effect is at least ₹5 lakh", () => {
    expect(filterMovers([t(1, 0.05)], 2, 500000).length).toBe(1);
    expect(filterMovers([t(1, 0.049)], 2, 500000).length).toBe(0);
  });
  it("collapses consecutive empty months into one row", () => {
    const p = (label: string, rate: number | null) => ({ key: label, label, rate } as never);
    const r = collapseEmptyPeriods([p("Mar", 5), p("Feb", null), p("Jan", null), p("Dec", 2)]);
    expect(r.length).toBe(3);
    expect(r[1]).toMatchObject({ kind: "gap", from: "Feb", to: "Jan", count: 2 });
  });
});

import { periodPasses } from "./purchase-material-trend";
describe("material screen period filter", () => {
  it("passes a 2% change, fails 1% with small effect", () => {
    expect(periodPasses(100, 102, 1, 2, 500000)).toBe(true);
    expect(periodPasses(100, 101, 1, 2, 500000)).toBe(false);
  });
  it("passes a 1% change with ₹5 lakh effect", () => {
    expect(periodPasses(100, 101, 500000, 2, 500000)).toBe(true);
  });
  it("first purchase always passes", () => { expect(periodPasses(null, 5, 1, 50, null)).toBe(true); });
});
