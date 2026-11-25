import { describe, expect, it } from "vitest";
import { dprDailyChart, type DprRow } from "./daily-production-data";
const r = (date: string, value: number) => ({ date, value }) as unknown as DprRow;
describe("Day Wise Production chart", () => {
  // 2026-06-06 Sat, 06-07 Sun, 06-08 Mon, 06-09 Tue
  const out = dprDailyChart([r("2026-06-06", 10), r("2026-06-07", 99), r("2026-06-09", 5), r("2026-06-09", 3)]);
  it("leaves out Sundays", () => expect(out.map((d) => d.date)).not.toContain("2026-06-07"));
  it("fills missing weekdays with zero", () => expect(out.find((d) => d.date === "2026-06-08")?.value).toBe(0));
  it("sums production per day", () => expect(out.find((d) => d.date === "2026-06-09")?.value).toBe(8));
});
