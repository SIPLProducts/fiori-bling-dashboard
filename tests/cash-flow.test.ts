import { describe, expect, it } from "vitest";
import { CASH_SAMPLE_ROWS, cashTotals, cashTrend, filterCashRows, searchCashLedger, cashComposition, CRORE } from "../src/lib/cash-flow";
describe("Cash Flow sample calculations", () => {
  it("derives net as credits minus debits", () => {
    const totals = cashTotals(CASH_SAMPLE_ROWS);
    expect(totals.credit / CRORE).toBeCloseTo(4892.4, 6);
    expect(totals.debit / CRORE).toBeCloseTo(3651.55, 6);
    expect(totals.net / CRORE).toBeCloseTo(1240.85, 6);
  });
  it("counts distinct active plants and GLs", () => {
    expect(cashTotals(CASH_SAMPLE_ROWS).plants).toBe(42);
    expect(cashTotals(CASH_SAMPLE_ROWS).gls).toBe(185);
  });
  it("intersects plant and quarter filters", () => {
    const rows = filterCashRows(CASH_SAMPLE_ROWS, { plant: "PL-01", quarter: "Q1" });
    expect(rows).toHaveLength(15);
    expect(rows.every(row => row.plant === "PL-01" && row.quarter === "Q1")).toBe(true);
    expect(filterCashRows(CASH_SAMPLE_ROWS, { plant: "absent" })).toHaveLength(0);
  });
  it("retains totals in monthly and quarterly grouping", () => {
    const monthly = cashTrend(CASH_SAMPLE_ROWS, false);
    const quarterly = cashTrend(CASH_SAMPLE_ROWS, true);
    expect(monthly).toHaveLength(12); expect(quarterly).toHaveLength(4);
    expect(quarterly.reduce((sum, row) => sum + row.credit, 0)).toBeCloseTo(4892.4, 6);
    expect(monthly.reduce((sum, row) => sum + row.debit, 0)).toBeCloseTo(3651.55, 6);
  });
  it("selects all searched rows for export independent of pagination", () => {
    const rows = searchCashLedger(filterCashRows(CASH_SAMPLE_ROWS, { plant: "PL-01" }), "GL-41002");
    expect(rows).toHaveLength(12);
    expect(rows.every(row => row.glCode === "GL-41002")).toBe(true);
  });
  it("composition includes every filtered amount", () => {
    const composition = cashComposition(CASH_SAMPLE_ROWS, "classification");
    expect(composition.reduce((sum, row) => sum + row.value, 0)).toBeCloseTo(8543.95, 6);
  });
});
import { mapZcashRow as mapRow, cashTotals as totalsOf } from "../src/lib/cash-flow.ts";
it("ZCASH_FLOW rows map and total using SAP NET", () => {
  const a = mapRow({ id: "1", plant: "1000", profit_center: "COFF100001", profit_center_name: "CORPORATE PC", gl_code: "0026350500", gl_name: "ADV", profit_center_group: "ALLOCATION", classification: "X", nature: "INVESTMENTS", debit: "63651273.00", credit: 0, net: 63651273, collection_disbursement: "INVESTMENTS" });
  const b = mapRow({ ...{ id: "2", plant: "1100", profit_center: "P", profit_center_name: null, gl_code: "G", gl_name: null, profit_center_group: null, classification: null, nature: null, collection_disbursement: null }, debit: 10, credit: 30, net: -20 });
  const t = totalsOf([a, b]);
  expect(t.debit).toBe(63651283);
  expect(t.credit).toBe(30);
  expect(t.net).toBe(63651253);
  expect(t.plants).toBe(2);
  expect(a.year).toBe("");
});
