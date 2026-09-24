import { describe, expect, test } from "bun:test";
import { applySdFilters, buildSdAnalytics, fiscalQuarter, type SdFilters, type SdLine } from "../src/lib/sd-live";

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
});