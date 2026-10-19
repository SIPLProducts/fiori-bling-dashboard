import { describe, expect, it, mock } from "bun:test";
mock.module("@/integrations/supabase/client", () => ({ supabase: {} }));
const { toOrderBookDashboardRow } = await import("@/lib/order-book-data");

describe("Order Book zone and region", () => {
  it("zone comes from BEZEI and region from BEZEI_SP", () => {
    const row = toOrderBookDashboardRow({ sales_order: "1", sales_order_item: "10", bezei: "Chennai", bezei_sp: "Maharashtra" });
    expect(row.zone).toBe("Chennai");
    expect(row.region).toBe("Maharashtra");
  });
});
