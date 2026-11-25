import { describe, expect, it } from "vitest";
import { defaultDprDates, dprDateOptions, matchesDprDates } from "./daily-production-filters";

describe("Daily Production posting filters", () => {
  it("opens on the latest available month with no posting dates", () => {
    expect(defaultDprDates([{ date: "2025-12-31" }, { date: "2026-06-10" }, { date: "" }])).toEqual({ year: ["2026"], month: ["06"], from: "", to: "" });
  });
  it("filters by several ticked months", () => {
    const filters = { year: ["2026"], month: ["04", "06"], from: "", to: "" };
    expect(["2026-04-02", "2026-05-31", "2026-06-10", "2025-06-10"].filter((d) => matchesDprDates(d, filters))).toEqual(["2026-04-02", "2026-06-10"]);
  });
  it("filters by several ticked years", () => {
    const filters = { year: ["2025", "2026"], month: null, from: "", to: "" };
    expect(["2024-06-01", "2025-06-01", "2026-06-01"].filter((d) => matchesDprDates(d, filters))).toEqual(["2025-06-01", "2026-06-01"]);
  });
  it("applies posting dates on top of year and month", () => {
    const filters = { year: ["2026"], month: ["06"], from: "2026-06-05", to: "2026-06-10" };
    expect(["2026-06-04", "2026-06-05", "2026-06-10", "2026-06-11"].filter((d) => matchesDprDates(d, filters))).toEqual(["2026-06-05", "2026-06-10"]);
  });
  it("none ticked means all", () => {
    expect(matchesDprDates("2025-01-01", { year: [], month: null, from: "", to: "" })).toBe(true);
  });
  it("lists months from all ticked years, latest first", () => {
    expect(dprDateOptions([{ date: "2024-12-31" }, { date: "2025-03-01" }, { date: "2026-06-10" }, { date: "2026-04-11" }], ["2025", "2026"])).toEqual({ years: ["2026", "2025", "2024"], months: ["06", "04", "03"] });
  });
  it("handles empty data", () => {
    expect(defaultDprDates([])).toEqual({ year: null, month: null, from: "", to: "" });
  });
});
