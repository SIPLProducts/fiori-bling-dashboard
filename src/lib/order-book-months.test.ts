import { describe, expect, it } from "vitest";
import { monthDivisions, summarizeByCreatedMonth } from "./order-book-months";

describe("month on month by division", () => {
  it("splits month value and distinct invoices per division", () => {
    const m = summarizeByCreatedMonth([
      { order: "1", orderDate: "2026-04-02", value: 2, division: "Auto" },
      { order: "1", orderDate: "2026-04-03", value: 1, division: "Auto" },
      { order: "2", orderDate: "2026-04-05", value: 4, division: "Solar" },
    ]);
    expect(m[0]?.value).toBe(7);
    expect(m[0]?.byDivision["Auto"]).toEqual({ value: 3, orders: 1 });
    expect(monthDivisions(m)).toEqual(["Solar", "Auto"]);
  });
});
