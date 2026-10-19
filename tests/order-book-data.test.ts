import { describe, expect, it, test } from "bun:test";
import { toOrderBookDashboardRow } from "../src/lib/order-book-data";

describe("toOrderBookDashboardRow", () => {
  it("uses NETWR (not TOT_INR) in crores and the sold-to customer", () => {
    const row = toOrderBookDashboardRow({ sales_order: "1", sales_order_item: "10", netwr: 25_000_000, tot_inr: 99_000_000, name1_sp: "ACME", kwmeng: 5, tot_ah: 3 });
    expect(row.value).toBe(2.5);
    expect(row.customer).toBe("ACME");
    expect(row.totalAh).toBe(3);
  });
  it("computes days open from the created date", () => {
    const row = toOrderBookDashboardRow({ sales_order: "1", sales_order_item: "10", created_date: "2026-10-01" }, new Date("2026-10-11T00:00:00Z"));
    expect(row.daysOpen).toBe(10);
  });
});

test("order book document type option uses AUART — VTEXT_DC", async () => {
  const { toOrderBookDashboardRow } = await import("../src/lib/order-book-data");
  const { documentTypeOptions } = await import("../src/lib/open-sales-orders-filters");
  const row = toOrderBookDashboardRow({ sales_order: "1", sales_order_item: "10", auart: "ZDOR", vtext_dc: "Domestic Sales", sector: "Power" });
  expect(documentTypeOptions([row]).map((o) => o.label)).toEqual(["ZDOR — Domestic Sales"]);
});
