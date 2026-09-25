import { describe, expect, test } from "bun:test";
import {
  applySdFilters,
  buildSdAnalytics,
  buildQuarterSummaries,
  fiscalYearForDate,
  fiscalQuarter,
  limitModelPerformance,
  loadConsistentPagedRows,
  qualifyingTotalAhRows,
  type SdFilters,
  type SdLine,
} from "../src/lib/sd-live";
import { buildDynamicColorMap, dynamicChartColor } from "../src/lib/chart-colors";

const filters = (patch: Partial<SdFilters> = {}): SdFilters => ({
  from: "",
  to: "",
  fiscalYears: [],
  quarters: [],
  plants: [],
  profitCentres: [],
  segments: [],
  customers: [],
  search: "",
  ...patch,
});

const row = (fiscalYear: string, postingDate: string): SdLine => ({
  id: `${fiscalYear}-${postingDate}`,
  plant: "",
  gl: "",
  glName: "",
  profitCtr: "",
  profitCtrName: "",
  group: "",
  salesType: "",
  companyCode: "",
  companyName: "",
  customer: "",
  customerName: "",
  fiscalYear,
  docNo: "",
  docDate: "",
  postingDate,
  month: "",
  reference: "",
  docType: "",
  postingKey: "",
  amount: 0,
  segment: "",
  salesOrder: "",
  salesOrderItem: "",
  material: "",
  materialDesc: "",
  quantity: 0,
  unit: "",
  division: "",
  industry: "",
  salesOffice: "",
  branch: "",
  countryCode: "",
  countryName: "",
  model: "",
  productType: "",
  productRange: "",
  productGroup: "",
  mainGroup: "",
  subGroup: "",
  customerGroup: "",
  customerProfile: "",
  usageDesc: "",
  salesOrg: "",
  incoterms: "",
  salesRep: "",
  salesRepName: "",
  totalAh: 0,
  ah: 0,
  pcShortName: "",
  newRepl: "",
  newReplacement: "",
  divisionName: "",
  industryName: "",
  docItem: "",
  materialProfitCtr: "",
  materialProfitCtrName: "",
  salesZone: "",
  amountDomestic: 0,
  amountExport: 0,
  amountService: 0,
  amountGross: 0,
  amountNet: 0,
  exciseDuty: 0,
  businessSegment: "",
});

describe("sales dashboard fiscal multi-select filters", () => {
  test("maps April–March fiscal quarters", () => {
    expect(fiscalQuarter("2026-04-01")).toBe("Q1");
    expect(fiscalQuarter("2026-07-01")).toBe("Q2");
    expect(fiscalQuarter("2026-10-01")).toBe("Q3");
    expect(fiscalQuarter("2026-03-31")).toBe("Q4");
    expect(fiscalYearForDate("2026-03-31")).toBe("2025");
    expect(fiscalYearForDate("2026-04-01")).toBe("2026");
  });

  test("uses OR within years and quarters and AND between filters", () => {
    const rows = [
      row("2025", "2025-04-01"),
      row("2026", "2026-08-01"),
      row("2026", "2026-11-01"),
      row("2027", "2027-04-01"),
    ];
    expect(
      applySdFilters(rows, filters({ fiscalYears: ["2025", "2026"], quarters: ["Q1", "Q2"] })),
    ).toEqual(rows.slice(0, 2));
  });

  test("empty fiscal selections include every row", () => {
    const rows = [row("2025", "2025-01-01"), row("2026", "2026-09-01")];
    expect(applySdFilters(rows, filters())).toEqual(rows);
  });
});

describe("fiscal quarter summary tiles", () => {
  const sale = (year: string, date: string, amount: number) => ({ ...row(year, date), amount });

  test("shows selected quarters only and compares sequential selections within one year", () => {
    const all = [
      sale("2025", "2026-01-10", 80),
      sale("2026", "2026-04-10", 100),
      sale("2026", "2026-07-10", 120),
      sale("2026", "2026-10-10", 150),
    ];
    const active = applySdFilters(all, filters({ fiscalYears: ["2026"], quarters: ["Q1", "Q3"] }));
    const summaries = buildQuarterSummaries(active, all, ["2026"], ["Q1", "Q3"]);

    expect(summaries.map((item) => item.quarter)).toEqual(["Q1", "Q3"]);
    expect(summaries[0]).toMatchObject({ amount: 100, baselineAmount: 80, changePct: 25, comparisonLabel: "vs Prior FY Q4" });
    expect(summaries[1]).toMatchObject({ amount: 150, baselineAmount: 120, changePct: 25, comparisonLabel: "vs Q2" });
  });

  test("compares matching quarters between the two latest selected fiscal years", () => {
    const all = [
      sale("2025", "2025-04-10", 100),
      sale("2025", "2025-07-10", 200),
      sale("2026", "2026-04-10", 120),
      sale("2026", "2026-07-10", 150),
    ];
    const active = applySdFilters(all, filters({ fiscalYears: ["2025", "2026"], quarters: ["Q1", "Q2"] }));
    const summaries = buildQuarterSummaries(active, all, ["2025", "2026"], ["Q1", "Q2"]);

    expect(summaries[0]).toMatchObject({ quarter: "Q1", amount: 120, baselineAmount: 100, changePct: 20 });
    expect(summaries[1]).toMatchObject({ quarter: "Q2", amount: 150, baselineAmount: 200, changePct: -25 });
  });

  test("uses neutral comparison without a year or a usable baseline", () => {
    const active = [sale("2026", "2026-04-10", 100)];
    const noYear = buildQuarterSummaries(active, active, [], ["Q1"]);
    const zeroBaseline = buildQuarterSummaries(active, active, ["2026"], ["Q1"]);

    expect(noYear[0]).toMatchObject({ amount: 100, baselineAmount: null, changePct: null, comparisonMode: "qoq" });
    expect(zeroBaseline[0]).toMatchObject({ amount: 100, baselineAmount: null, changePct: null });
  });

  test("infers QoQ comparisons for This year when no fiscal year is selected", () => {
    const history = [
      sale("2026", "2026-01-10", 80),
      sale("2026", "2026-04-10", 100),
      sale("2026", "2026-07-10", 125),
    ];
    const active = applySdFilters(history, filters({ from: "2026-01-01", to: "2026-09-25" }));
    const summaries = buildQuarterSummaries(active, history, [], [], { from: "2026-01-01", to: "2026-09-25" });

    expect(summaries[0]).toMatchObject({ quarter: "Q1", amount: 100, baselineAmount: 80, changePct: 25, comparisonMode: "qoq" });
    expect(summaries[1]).toMatchObject({ quarter: "Q2", amount: 125, baselineAmount: 100, changePct: 25 });
  });

  test("switches a date range of 18 months or more to matching-quarter YoY", () => {
    const history = [
      sale("2025", "2025-04-10", 100),
      sale("2026", "2026-04-10", 140),
      sale("2025", "2025-07-10", 200),
      sale("2026", "2026-07-10", 150),
    ];
    const summaries = buildQuarterSummaries(history, history, [], ["Q1", "Q2"], {
      from: "2025-04-01",
      to: "2026-09-30",
    });

    expect(summaries[0]).toMatchObject({ quarter: "Q1", amount: 140, baselineAmount: 100, changePct: 40, comparisonMode: "yoy" });
    expect(summaries[1]).toMatchObject({ quarter: "Q2", amount: 150, baselineAmount: 200, changePct: -25, comparisonMode: "yoy" });
  });

  test("compares a partial multi-year quarter with the same elapsed days in the prior year", () => {
    const history = [
      sale("2025", "2025-04-10", 50),
      sale("2025", "2025-06-30", 500),
      sale("2026", "2026-04-10", 75),
    ];
    const active = applySdFilters(history, filters({ from: "2025-04-01", to: "2026-04-30" }));
    const summary = buildQuarterSummaries(active, history, ["2025", "2026"], ["Q1"], {
      from: "2025-04-01",
      to: "2026-04-30",
    })[0];

    expect(summary).toMatchObject({ status: "partial", baselineAmount: 50, changePct: 50, comparisonMode: "yoy" });
  });

  test("keeps partial current-quarter amounts while using the historical baseline", () => {
    const history = [
      sale("2026", "2026-04-10", 100),
      sale("2026", "2026-07-10", 50),
      sale("2026", "2026-08-10", -10),
    ];
    const active = applySdFilters(history, filters({ from: "2026-07-01", to: "2026-08-15" }));
    const summary = buildQuarterSummaries(active, history, [], ["Q2"], {
      from: "2026-07-01",
      to: "2026-08-15",
    })[0];

    expect(summary).toMatchObject({ amount: 40, baselineAmount: 100, changePct: -60, varianceAmount: -60 });
    expect(summary?.trend.map((point) => point.value)).toEqual([50, -10, 0]);
  });

  test("marks future quarters outside range and compares a partial quarter by elapsed days", () => {
    const history = [
      sale("2026", "2026-04-10", 40),
      sale("2026", "2026-06-30", 60),
      sale("2026", "2026-07-10", 75),
      sale("2026", "2026-09-25", 25),
    ];
    const active = applySdFilters(history, filters({ from: "2026-04-01", to: "2026-09-25" }));
    const summaries = buildQuarterSummaries(active, history, [], [], { from: "2026-04-01", to: "2026-09-25" });

    expect(summaries[0]).toMatchObject({ quarter: "Q1", status: "complete" });
    expect(summaries[1]).toMatchObject({
      quarter: "Q2",
      status: "partial",
      statusLabel: "Partial (Through 25 Sept)",
      baselineAmount: 40,
      changePct: 150,
      comparisonLabel: "vs Q1 · same elapsed days",
    });
    expect(summaries[2]).toMatchObject({ quarter: "Q3", status: "outside", changePct: null, varianceAmount: null });
    expect(summaries[3]).toMatchObject({ quarter: "Q4", status: "outside", changePct: null, varianceAmount: null });
  });

  test("quarter amounts use the same actively filtered rows as Total Sales", () => {
    const active = [sale("2026", "2026-04-10", 25), sale("2026", "2026-07-10", -5)];
    const summaries = buildQuarterSummaries(active, active, ["2026"], []);
    expect(summaries.reduce((sum, item) => sum + item.amount, 0)).toBe(buildSdAnalytics(active).kpis.revenue);
  });
});

describe("stable active snapshot paging", () => {
  test("returns every same-date row once when page order is deterministic", async () => {
    const source = Array.from({ length: 7 }, (_, index) => ({
      id: `id-${String(index).padStart(2, "0")}`,
      postingDate: "2026-09-15",
    }));

    const result = await loadConsistentPagedRows({
      readMarker: async () => ({ count: source.length, latestUpdatedAt: "snapshot-a" }),
      readPage: async (from) => source.slice(from, from + 3),
      rowKey: (item) => item.id,
      pageSize: 3,
      concurrency: 2,
    });

    expect(result.map((item) => item.id)).toEqual(source.map((item) => item.id));
    expect(new Set(result.map((item) => item.id)).size).toBe(source.length);
  });

  test("discards mixed pages and retries after a snapshot changes", async () => {
    const oldRows = [{ id: "old-1" }, { id: "old-2" }, { id: "old-3" }];
    const newRows = [{ id: "new-1" }, { id: "new-2" }, { id: "new-3" }];
    let markerReads = 0;
    let pageReads = 0;

    const result = await loadConsistentPagedRows({
      readMarker: async () => {
        markerReads += 1;
        return markerReads === 1
          ? { count: 3, latestUpdatedAt: "snapshot-a" }
          : { count: 3, latestUpdatedAt: "snapshot-b" };
      },
      readPage: async (from) => {
        pageReads += 1;
        const source = pageReads === 1 ? oldRows : newRows;
        return source.slice(from, from + 2);
      },
      rowKey: (item) => item.id,
      pageSize: 2,
      concurrency: 1,
    });

    expect(result).toEqual(newRows);
    expect(markerReads).toBe(4);
  });

  test("rejects duplicate page rows instead of calculating a mixed dashboard", async () => {
    await expect(loadConsistentPagedRows({
      readMarker: async () => ({ count: 2, latestUpdatedAt: "snapshot-a" }),
      readPage: async () => [{ id: "same" }, { id: "same" }],
      rowKey: (item) => item.id,
      pageSize: 2,
      maxAttempts: 1,
    })).rejects.toThrow("Sales data changed while loading");
  });
});

describe("sales dashboard group division analytics", () => {
  test("aggregates PC Short Name within main and sub groups", () => {
    const rows = [
      { ...row("2026", "2026-04-01"), mainGroup: "BATTERY", subGroup: "OEM", pcShortName: "OEM_LIB", amount: 120 },
      { ...row("2026", "2026-04-02"), mainGroup: "BATTERY", subGroup: "OEM", pcShortName: "SPEC_DEF", amount: 80 },
      { ...row("2026", "2026-04-03"), mainGroup: "BATTERY", subGroup: "OEM", pcShortName: "OEM_LIB", amount: 30 },
      { ...row("2026", "2026-04-04"), mainGroup: "BATTERY", subGroup: "RETAIL", pcShortName: "REG_PE", amount: 50 },
    ];

    const analytics = buildSdAnalytics(rows);

    expect(analytics.divisionsByMainGroup["BATTERY"]).toEqual([
      { name: "OEM_LIB", value: 150, count: 2 },
      { name: "SPEC_DEF", value: 80, count: 1 },
      { name: "REG_PE", value: 50, count: 1 },
    ]);
    expect(analytics.divisionsBySubGroup["BATTERY"]?.["OEM"]).toEqual([
      { name: "OEM_LIB", value: 150, count: 2 },
      { name: "SPEC_DEF", value: 80, count: 1 },
    ]);
  });

  test("keeps every sub group and sorts them by amount without an Others bucket", () => {
    const rows = Array.from({ length: 12 }, (_, index) => ({
      ...row("2026", `2026-04-${String(index + 1).padStart(2, "0")}`),
      mainGroup: "INDL.BATTERY",
      subGroup: `SUB-${String(index + 1).padStart(2, "0")}`,
      pcShortName: index % 2 ? "VNCPP" : "NCPP",
      amount: 120 - index,
    }));

    const analytics = buildSdAnalytics(rows);
    const subGroups = analytics.subGroupsByMainGroup["INDL.BATTERY"] ?? [];

    expect(subGroups).toHaveLength(12);
    expect(subGroups.map((item) => item.name)).toEqual(rows.map((item) => item.subGroup));
    expect(subGroups.some((item) => item.name === "Others")).toBe(false);
  });

  test("keeps zero and low-value sub groups and their division legend values", () => {
    const rows = [
      { ...row("2026", "2026-04-01"), mainGroup: "INDL.BATTERY", subGroup: "BATTERY", pcShortName: "VZNM", amount: 1_000 },
      { ...row("2026", "2026-04-02"), mainGroup: "INDL.BATTERY", subGroup: "SMS", pcShortName: "SMS", amount: 1 },
      { ...row("2026", "2026-04-03"), mainGroup: "INDL.BATTERY", subGroup: "PEU", pcShortName: "PEU", amount: 0 },
    ];

    const analytics = buildSdAnalytics(rows);

    expect(analytics.subGroupsByMainGroup["INDL.BATTERY"]).toEqual([
      { name: "BATTERY", value: 1_000, count: 1 },
      { name: "SMS", value: 1, count: 1 },
      { name: "PEU", value: 0, count: 1 },
    ]);
    expect(analytics.divisionsBySubGroup["INDL.BATTERY"]?.["PEU"]).toEqual([
      { name: "PEU", value: 0, count: 1 },
    ]);
    expect(analytics.divisionsBySubGroup["INDL.BATTERY"]?.["PEU"]?.[0]?.count).toBeGreaterThan(0);
  });
});

describe("customer contribution Pareto", () => {
  test("returns only the ten highest customers with individual and cumulative shares", () => {
    const rows = Array.from({ length: 12 }, (_, index) => ({
      ...row("2026", `2026-04-${String(index + 1).padStart(2, "0")}`),
      customer: `C-${String(index + 1).padStart(2, "0")}`,
      customerName: `Customer ${String(index + 1).padStart(2, "0")}`,
      amount: (index + 1) * 10,
    }));

    const pareto = buildSdAnalytics(rows).pareto;

    expect(pareto).toHaveLength(10);
    expect(pareto.map((item) => item.customer)).toEqual([
      "Customer 12",
      "Customer 11",
      "Customer 10",
      "Customer 09",
      "Customer 08",
      "Customer 07",
      "Customer 06",
      "Customer 05",
      "Customer 04",
      "Customer 03",
    ]);
    expect(pareto[0]?.value).toBe(120);
    expect(pareto[0]?.contributionPct).toBeCloseTo((120 / 780) * 100);
    expect(pareto[9]?.cumulativePct).toBeCloseTo((750 / 780) * 100);
  });

  test("handles fewer than ten customers without synthetic buckets", () => {
    const rows = [
      { ...row("2026", "2026-04-01"), customerName: "Alpha", amount: 60 },
      { ...row("2026", "2026-04-02"), customerName: "Beta", amount: 40 },
    ];

    expect(buildSdAnalytics(rows).pareto).toEqual([
      { customer: "Alpha", value: 60, contributionPct: 60, cumulativePct: 60 },
      { customer: "Beta", value: 40, contributionPct: 40, cumulativePct: 100 },
    ]);
  });
});

describe("positive Total AH summary metrics", () => {
  test("sums Total AH and local currency from the same records where Total AH is greater than zero", () => {
    const rows = [
      { ...row("2026", "2026-04-01"), ah: 1, totalAh: 150_000, amount: 20_000_000 },
      { ...row("2026", "2026-04-02"), ah: 0, totalAh: 50_000, amount: -10_000_000 },
      { ...row("2026", "2026-04-03"), ah: 90_000, totalAh: 0, amount: 90_000_000 },
      { ...row("2026", "2026-04-04"), ah: 80_000, totalAh: -10_000, amount: 80_000_000 },
    ];

    const qualifyingRows = qualifyingTotalAhRows(rows);
    const { kpis } = buildSdAnalytics(rows);

    expect(qualifyingRows).toHaveLength(2);
    expect(qualifyingRows.map((item) => item.postingDate)).toEqual(["2026-04-01", "2026-04-02"]);
    expect(kpis.positiveAhTotal).toBe(200_000);
    expect(kpis.positiveAhSales).toBe(10_000_000);
  });

  test("matches the verified unfiltered Net Sales List benchmark", () => {
    const rows = [
      { ...row("2026", "2026-04-01"), totalAh: 642_371_668.96, amount: 15_153_736_916 },
      { ...row("2026", "2026-04-02"), totalAh: 0, amount: 500_000_000 },
      { ...row("2026", "2026-04-03"), totalAh: -10, amount: 500_000_000 },
    ];

    const { kpis } = buildSdAnalytics(rows);

    expect(kpis.positiveAhTotal).toBe(642_371_668.96);
    expect(kpis.positiveAhSales).toBe(15_153_736_916);
    expect((kpis.positiveAhTotal / 100_000).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })).toBe("6,423.72");
    expect((kpis.positiveAhSales / 10_000_000).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })).toBe("1,515.37");
  });
});

describe("Sales by Model amount and per-AH analytics", () => {
  test("groups the shared positive Total AH rows, keeps negatives, and ranks by sales", () => {
    const rows = [
      { ...row("2026", "2026-04-01"), model: "KBL", totalAh: 100_000, amount: 20_000_000 },
      { ...row("2026", "2026-04-02"), model: "KBL", totalAh: 50_000, amount: -5_000_000 },
      { ...row("2026", "2026-04-03"), model: "HVM", totalAh: 100_000, amount: 25_000_000 },
      { ...row("2026", "2026-04-04"), model: "KPH", totalAh: 0, amount: 90_000_000 },
      { ...row("2026", "2026-04-05"), model: "", totalAh: 10_000, amount: 1_000_000 },
    ];

    const analytics = buildSdAnalytics(rows);

    expect(analytics.modelPerformance.map((item) => item.model)).toEqual(["HVM", "KBL", "Unassigned"]);
    expect(analytics.modelPerformance[0]).toEqual({
      model: "HVM",
      totalAmount: 25_000_000,
      totalAh: 100_000,
      perAhRate: 250,
      recordCount: 1,
      salesSharePct: (25_000_000 / 41_000_000) * 100,
    });
    expect(analytics.modelPerformance[1]).toEqual({
      model: "KBL",
      totalAmount: 15_000_000,
      totalAh: 150_000,
      perAhRate: 100,
      recordCount: 2,
      salesSharePct: (15_000_000 / 41_000_000) * 100,
    });
    expect(analytics.modelPerformance[2]?.salesSharePct).toBeCloseTo((1_000_000 / 41_000_000) * 100);
    expect(limitModelPerformance(analytics.modelPerformance, 10)).toHaveLength(3);
    expect(limitModelPerformance(analytics.modelPerformance, 20)).toHaveLength(3);
    expect(limitModelPerformance(analytics.modelPerformance, "all")).toEqual(analytics.modelPerformance);
  });
});

describe("dynamic PC Short Name colors", () => {
  test("keeps colors stable and distinct beyond the former ten-color limit", () => {
    const names = Array.from({ length: 24 }, (_, index) => `DIVISION-${index + 1}`);
    const colors = buildDynamicColorMap(names);

    expect(new Set(colors.values()).size).toBe(names.length);
    expect(colors.get("DIVISION-17")).toBe(dynamicChartColor("DIVISION-17"));
    expect(buildDynamicColorMap(["DIVISION-17"]).get("DIVISION-17")).toBe(colors.get("DIVISION-17"));
  });
});