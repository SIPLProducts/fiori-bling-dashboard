import { expect, test } from "bun:test";
import { TOTAL_PURCHASE, TOP_VENDORS, quarterlyYoy } from "../src/lib/purchase-register-sample";

test("sample figures are cleared", () => {
  expect(TOTAL_PURCHASE).toBe(0);
  expect(TOP_VENDORS.length).toBe(0);
  expect(quarterlyYoy()).toBe(0);
});
