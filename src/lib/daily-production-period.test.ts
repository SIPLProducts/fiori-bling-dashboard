import { describe, expect, it } from "vitest";
import { dprPeriodSummary, type DprRow } from "./daily-production-data";
import { currentReportPeriod } from "./report-period";

const row = (date: string, value: number, scrapVal: number, syncedAt = "2026-11-19T05:00:00Z") => ({ date, value, scrapVal, syncedAt } as DprRow);

describe("Daily Production current financial year summary", () => {
  it("counts only rows from 1 April to today", () => {
    const fy = currentReportPeriod(new Date("2026-11-19T10:00:00Z"));
    expect(fy.from).toBe("2026-04-01");
    const s = dprPeriodSummary([row("2026-03-31", 100, 1), row("2026-04-01", 200, 5), row("2026-06-10", 300, 10, "2026-11-19T06:00:00Z")], fy.from, fy.to);
    expect(s).toEqual({ production: 500, scrap: 15, count: 2, syncedAt: "2026-11-19T06:00:00Z" });
  });
});

import { dprLatestMonthSummary } from "./daily-production-data";
describe("Daily Production launchpad latest month", () => {
  it("uses only the latest month and counts each order once", () => {
    const r = (date: string, order: string, value: number, scrapVal: number) => ({ date, order, value, scrapVal, syncedAt: "x" } as DprRow);
    const s = dprLatestMonthSummary([r("2026-05-30", "A", 999, 9), r("2026-06-01", "A", 100, 10), r("2026-06-02", "A", 200, 20), r("2026-06-03", "B", 300, 0)]);
    expect(s).toMatchObject({ month: "Jun 2026", orders: 2, production: 600, scrap: 30, net: 570 });
  });
});
