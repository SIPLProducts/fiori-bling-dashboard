import { describe, expect, test } from "bun:test";
import { countDistinctOrders } from "../src/lib/open-sales-orders-table";
import type { OpenSalesOrder } from "../src/lib/open-sales-orders-data";

const row = (order: string) => ({ order }) as OpenSalesOrder;

describe("Distinct order count", () => {
  test("counts unique sales order numbers across repeated line items", () => {
    const rows = ["10001", "10001", "10001", "10002", "10003", "10002"].map(row);
    expect(countDistinctOrders(rows)).toBe(3);
  });
  test("returns zero for empty rows and one for a single order", () => {
    expect(countDistinctOrders([])).toBe(0);
    expect(countDistinctOrders([row("90001"), row("90001")])).toBe(1);
  });
});
