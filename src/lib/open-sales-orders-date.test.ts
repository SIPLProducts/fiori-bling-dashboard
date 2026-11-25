import { describe, expect, it } from "vitest";
import { displayOpenOrderDate } from "./open-sales-orders-table";

describe("displayOpenOrderDate", () => {
  it("shows dd-mm-yyyy", () => {
    expect(displayOpenOrderDate("2026-11-05")).toBe("05-11-2026");
  });
});
