import { expect, test } from "bun:test";
import { TOTAL_PURCHASE, TYPE_TOTALS, quarterlyYoy } from "../src/lib/purchase-register-sample";

test("type totals add up to total purchase value 2,950.88 Cr", () => {
  expect(Math.round((TYPE_TOTALS.Domestic + TYPE_TOTALS.Imported + TYPE_TOTALS.Service) * 100) / 100).toBe(TOTAL_PURCHASE);
});

test("quarterly YoY is -62.9%", () => {
  expect(quarterlyYoy()).toBe(-62.9);
});
