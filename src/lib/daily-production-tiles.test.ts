import { describe, expect, it } from "vitest";
import { dprTotals, type DprRow } from "./daily-production-data";

const row = (order: string, value: number, scrapVal: number) => ({ order, value, scrapVal, qty: 0, scrapQty: 0 }) as unknown as DprRow;

describe("Daily Production tiles", () => {
  const t = dprTotals([row("1001", 500, 20), row("1001", 300, 10), row("1002", 200, 0), row("", 50, 5)]);
  it("counts each Prod. Order once", () => expect(t.orders).toBe(2));
  it("Prod Val sums Value", () => expect(t.value).toBe(1050));
  it("Scrap Val sums Scrap Val", () => expect(t.scrapVal).toBe(35));
  it("Net Prod Val = Prod Val - Scrap Val", () => expect(t.net).toBe(1015));
});
