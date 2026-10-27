import { describe, expect, test } from "bun:test";
import { fyOf, monthOf, rankBy, toPurchaseRow, typeTotals } from "../src/lib/purchase-register-data";

const row = (o: Record<string, string | number | null>) => toPurchaseRow({ budat: "2026-06-05", ty_mat: "RAW MATERIAL", ty_purch: "Domestic", shkzg: "S", ...o });

describe("purchase register data", () => {
  test("uses NET_AMT in crores and negates unsigned credit lines", () => {
    expect(row({ net_amt: 20000000 }).value).toBe(2);
    expect(row({ net_amt: 10000000, shkzg: "H" }).value).toBe(-1);
    expect(row({ net_amt: -10000000, shkzg: "H" }).value).toBe(-1);
  });
  test("type totals split by TY_PURCH", () => {
    const t = typeTotals([row({ net_amt: 1e7 }), row({ net_amt: 3e7, ty_purch: "Imported" }), row({ net_amt: 2e7, ty_purch: "Service" })]);
    expect(t).toEqual({ Domestic: 1, Imported: 3, Service: 2 });
  });
  test("April–March FY bucketing", () => {
    expect(fyOf("2026-03-31")).toBe(2025);
    expect(fyOf("2026-04-01")).toBe(2026);
    expect(monthOf("2026-06-10")).toBe("Jun");
  });
  test("ranks top vendors by value", () => {
    const r = rankBy([row({ lifnr: "A", net_amt: 1e7 }), row({ lifnr: "B", net_amt: 5e7 }), row({ lifnr: "A", net_amt: 1e7 })], (x) => x.vendor, (x) => x.vendorName);
    expect(r.map((x) => [x.code, x.value])).toEqual([["B", 5], ["A", 2]]);
  });
});
