import { describe, expect, it } from "vitest";
import { toOrderBookDashboardRow } from "../src/lib/order-book-data";

describe("toOrderBookDashboardRow", () => {
  it("uses TOT_INR in crores and the sold-to customer", () => {
    const row = toOrderBookDashboardRow({ sales_order: "1", sales_order_item: "10", tot_inr: 25_000_000, name1_sp: "ACME", kwmeng: 5, tot_ah: 3 });
    expect(row.value).toBe(2.5);
    expect(row.customer).toBe("ACME");
    expect(row.totalAh).toBe(3);
  });
  it("computes days open from the created date", () => {
    const row = toOrderBookDashboardRow({ sales_order: "1", sales_order_item: "10", created_date: "2026-10-01" }, new Date("2026-10-11T00:00:00Z"));
    expect(row.daysOpen).toBe(10);
  });
});
