import { describe, expect, test } from "bun:test";
import { hasModelWiseType } from "../src/lib/open-sales-orders-filters";
import type { OpenSalesOrder } from "../src/lib/open-sales-orders-data";

const row = (model: string) => ({ model }) as OpenSalesOrder;

describe("Model Wise chart groups", () => {
  test("keeps lines that carry a model name", () => {
    expect(hasModelWiseType(row("KPH"))).toBe(true);
    expect(hasModelWiseType(row("  HVM  "))).toBe(true);
  });
  test("drops lines whose model is blank or the Unassigned placeholder", () => {
    expect(hasModelWiseType(row("Unassigned"))).toBe(false);
    expect(hasModelWiseType(row("UNASSIGNED"))).toBe(false);
    expect(hasModelWiseType(row("   "))).toBe(false);
    expect(hasModelWiseType(row(""))).toBe(false);
  });
});
