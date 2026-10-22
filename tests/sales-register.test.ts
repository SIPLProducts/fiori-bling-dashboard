import { describe, expect, it } from "vitest";
import { buildSalesRegister, type SalesRegisterRow } from "../src/lib/sales-register";

const row = (p: Partial<SalesRegisterRow>): SalesRegisterRow => ({
  billingDate: "2026-03-02", billingDocument: "B1", invoiceNo: "I1", customer: "C1", customerName: "A",
  plant: "1000", profitCenter: "PC1", mainGroup: "M", subGroup: "S", productCategory: "P", channel: "D",
  material: "X", billedQty: 1, netValue: 80, invoiceValue: 100, cgst: 0, sgst: 0, igst: 0, tcs: 0, status: "Posted", ...p,
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
});
