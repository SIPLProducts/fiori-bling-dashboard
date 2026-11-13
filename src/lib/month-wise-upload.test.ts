import { describe, expect, it } from "vitest";
import { FY_MONTH_ORDER, nonEmptyRows, orderColumns } from "./month-wise-upload";

describe("month wise upload", () => {
  it("keeps file column order with extras last", () => {
    expect(orderColumns([{ data: { "CB Val": "1", Extra: "x", Plnt: "1000" } }])).toEqual(["Plnt", "CB Val", "Extra"]);
  });
  it("skips fully empty rows", () => {
    expect(nonEmptyRows([{ a: "" }, { a: "1" }])).toEqual([{ a: "1" }]);
  });
  it("lists months April to March", () => {
    expect(FY_MONTH_ORDER[0]).toBe(4);
    expect(FY_MONTH_ORDER[11]).toBe(3);
  });
});
