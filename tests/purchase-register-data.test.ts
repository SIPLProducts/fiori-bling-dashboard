import { describe, expect, test } from "bun:test";
import { fyOf, monthOf, rankBy, toPurchaseRow, typeTotals } from "../src/lib/purchase-register-data";

const row = (o: Parameters<typeof toPurchaseRow>[0]) => toPurchaseRow({ budat: "2026-06-05", ty_mat: "RAW MATERIAL", ty_purch: "Domestic", shkzg: "S", ...o });

describe("purchase register data", () => {
  test("uses TOTAL in crores and negates unsigned credit lines", () => {
    expect(row({ total: 20000000 }).value).toBe(2);
    expect(row({ total: 10000000, shkzg: "H" }).value).toBe(-1);
    expect(row({ total: -10000000, shkzg: "H" }).value).toBe(-1);
  });
  test("type totals split by TY_PURCH", () => {
    const t = typeTotals([row({ total: 1e7 }), row({ total: 3e7, ty_purch: "Imported" }), row({ total: 2e7, ty_purch: "Service" })]);
    expect(t).toEqual({ Domestic: 1, Imported: 3, Service: 2 });
  });
  test("April–March FY bucketing", () => {
    expect(fyOf("2026-03-31")).toBe(2025);
    expect(fyOf("2026-04-01")).toBe(2026);
    expect(monthOf("2026-06-10")).toBe("Jun");
  });
  test("ranks top vendors by value", () => {
    const r = rankBy([row({ lifnr: "A", total: 1e7 }), row({ lifnr: "B", total: 5e7 }), row({ lifnr: "A", total: 1e7 })], (x) => x.vendor, (x) => x.vendorName);
    expect(r.map((x) => [x.code, x.value])).toEqual([["B", 5], ["A", 2]]);
  });
});
