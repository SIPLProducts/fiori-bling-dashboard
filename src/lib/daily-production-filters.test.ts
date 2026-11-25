import { describe, expect, it } from "vitest";
import { defaultDprDates, dprDateOptions, matchesDprDates } from "./daily-production-filters";

describe("Daily Production posting filters", () => {
  it("opens on the current month when it is the latest available month", () => {
    expect(defaultDprDates([{ date: "2026-10-30" }, { date: "2026-11-25" }])).toEqual({ year: "2026", month: "11", from: "", to: "" });
  });
  it("falls back to the latest available month with no posting dates selected", () => {
    expect(defaultDprDates([{ date: "2025-12-31" }, { date: "2026-06-10" }, { date: "" }])).toEqual({ year: "2026", month: "06", from: "", to: "" });
  });
  it("filters all report data by selected year and month", () => {
    const filters = { year: "2026", month: "06", from: "", to: "" };
    expect(["2025-06-10", "2026-05-31", "2026-06-10"].filter((date) => matchesDprDates(date, filters))).toEqual(["2026-06-10"]);
  });
  it("applies posting dates on top of year and month", () => {
    const filters = { year: "2026", month: "06", from: "2026-06-05", to: "2026-06-10" };
    expect(["2026-06-04", "2026-06-05", "2026-06-10", "2026-06-11"].filter((date) => matchesDprDates(date, filters))).toEqual(["2026-06-05", "2026-06-10"]);
  });
  it("All removes the year and month restrictions", () => {
    expect(matchesDprDates("2025-01-01", { year: "all", month: "all", from: "", to: "" })).toBe(true);
  });
  it("lists only months available in the selected year", () => {
    expect(dprDateOptions([{ date: "2025-12-31" }, { date: "2026-06-10" }, { date: "2026-06-11" }], "2026")).toEqual({ years: ["2026", "2025"], months: ["06"] });
  });
  it("handles empty data without choosing posting dates", () => {
    expect(defaultDprDates([])).toEqual({ year: "all", month: "all", from: "", to: "" });
  });
});
describe("month order", () => {
  it("lists latest month first", () => {
    expect(dprDateOptions([{ date: "2026-04-02" }, { date: "2026-06-10" }, { date: "2026-05-01" }], "2026").months).toEqual(["06", "05", "04"]);
  });
});
