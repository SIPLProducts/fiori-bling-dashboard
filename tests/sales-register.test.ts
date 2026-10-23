import { describe, expect, it } from "vitest";
import { buildSalesRegister, salesRegisterOptionLabels, type SalesRegisterRow } from "../src/lib/sales-register";

const row = (p: Partial<SalesRegisterRow>): SalesRegisterRow => ({
  billingDate: "2026-03-02", billingDocument: "B1", invoiceNo: "I1", customer: "C1", customerName: "A",
  plant: "1000", profitCenter: "PC1", mainGroup: "M", subGroup: "S", productCategory: "P", channel: "D",
  material: "X", billedQty: 1, netValue: 80, invoiceValue: 100, cgst: 0, sgst: 0, igst: 0, tcs: 0, status: "Posted", creationDate: "2026-03-02", channelCode: "01", division: "01", billingType: "ZDF2", salesDocument: "S1", salesDocumentItem: "10", salesOffice: "O", materialCode: "M1", ...p,
});

describe("sales register", () => {
  it("totals values and counts distinct customers and documents", () => {
    const r = buildSalesRegister([row({}), row({ billingDocument: "B1" }), row({ billingDocument: "B2", customer: "C2" })]);
    expect(r.totalInvoice).toBe(300);
    expect(r.totalNet).toBe(240);
    expect(r.customers).toBe(2);
    expect(r.documents).toBe(2);
  });
  it("keeps only top 10 plants", () => {
    const rows = Array.from({ length: 12 }, (_, i) => row({ plant: `P${i}`, invoiceValue: i }));
    expect(buildSalesRegister(rows).byPlant).toHaveLength(10);
  });
  it("reports earliest and latest billing date", () => {
    expect(buildSalesRegister([row({ billingDate: "2026-03-05" }), row({ billingDate: "2026-01-10" })]).dateRange).toEqual({ from: "2026-01-10", to: "2026-03-05" });
    expect(buildSalesRegister([]).dateRange).toBeNull();
  });
});

import { filterSalesRegister } from "../src/lib/sales-register";
import { toSalesRegisterRow } from "../src/lib/sales-register-data";
import { mapSalesRegisterPayload } from "../src/lib/sales-register-map";

describe("sales register SAP mapping", () => {
  const sap = { VBELN: "0900219884", POSNR: 30, FKDAT: "2026-03-02", NETWR: "   462,000.00", NETWR_TOT: 462000, NETWR_T: 545160, KWERT_IGST: 83160, RFBSK: "C", WERKS: "1800", MAIN_GRP: "", MAIN_GROUP: "CONCRETE", ZWREXPDT: "2031-02-03" };
  it("stores typed numbers and dates keyed by VBELN + POSNR", () => {
    const { rows } = mapSalesRegisterPayload([sap, sap], "Sales _Register");
    expect(rows).toHaveLength(1);
    expect(rows[0]!.netwr).toBe(462000);
    expect(rows[0]!.zwrexpdt).toBe("2031-02-03");
    expect(rows[0]!.posnr).toBe("30");
  });
  it("net = NETWR_TOT, invoice = NETWR_T, RFBSK C = Posted, MAIN_GROUP fallback", () => {
    const db = mapSalesRegisterPayload([sap], "x").rows[0] as never;
    const r = toSalesRegisterRow(db);
    expect(r.netValue).toBe(462000);
    expect(r.invoiceValue).toBe(545160);
    expect(r.status).toBe("Posted");
    expect(r.mainGroup).toBe("CONCRETE");
  });
  it("filters by plant selection and billing date range", () => {
    const a = row({ plant: "1800", billingDate: "2026-03-02" }), b = row({ plant: "1100", billingDate: "2026-04-02" });
    expect(filterSalesRegister([a, b], { codes: { plant: ["1800"] }, dates: {} })).toEqual([a]);
    expect(filterSalesRegister([a, b], { codes: {}, dates: { billingDate: { mode: "range", from: "2026-04-01", to: "" } } })).toEqual([b]);
  });
});

describe("sales register code + description", () => {
  it("uses AUART with VTEXT_DC for distribution channel", () => {
    const r = toSalesRegisterRow({ auart: "ZDOR", vtext_dc: "Domestic Sales", vtweg_auft: "01" });
    expect(r.channelCode).toBe("ZDOR");
    expect(salesRegisterOptionLabels([r], "distributionChannel")).toEqual([{ value: "ZDOR", label: "ZDOR — Domestic Sales" }]);
  });
  it("shows the code alone when no description", () => {
    expect(salesRegisterOptionLabels([toSalesRegisterRow({ spart: "01" })], "division")).toEqual([{ value: "01", label: "01" }]);
  });
});
