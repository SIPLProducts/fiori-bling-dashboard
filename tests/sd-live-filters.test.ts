import { describe, expect, test } from "bun:test";
import { applySdFilters, buildSdAnalytics, fiscalQuarter, type SdFilters, type SdLine } from "../src/lib/sd-live";
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

describe("positive AH summary metrics", () => {
  test("sums AH and local currency only for records where AH is greater than zero", () => {
    const rows = [
      { ...row("2026", "2026-04-01"), ah: 150_000, amount: 20_000_000 },
      { ...row("2026", "2026-04-02"), ah: 50_000, amount: 10_000_000 },
      { ...row("2026", "2026-04-03"), ah: 0, amount: 90_000_000 },
      { ...row("2026", "2026-04-04"), ah: -10_000, amount: 80_000_000 },
    ];

    const { kpis } = buildSdAnalytics(rows);

    expect(kpis.positiveAhTotal).toBe(200_000);
    expect(kpis.positiveAhSales).toBe(30_000_000);
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