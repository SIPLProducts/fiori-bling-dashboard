import { describe, expect, test } from "bun:test";
import { summarizeByCreatedMonth } from "../src/lib/order-book-months";

describe("Order Book Month on Month", () => {
  test("sums value and counts distinct orders per created month, oldest first", () => {
    const result = summarizeByCreatedMonth([
      { order: "2", orderDate: "2026-05-03", value: 2 },
      { order: "1", orderDate: "2026-04-10", value: 1.5 },
      { order: "1", orderDate: "2026-04-20", value: 0.5 },
      { order: "3", orderDate: "", value: 9 },
    ]);
    expect(result).toEqual([
      { key: "2026-04", name: "Apr 26", value: 2, orders: 1 },
      { key: "2026-05", name: "May 26", value: 2, orders: 1 },
    ]);
  });
});
