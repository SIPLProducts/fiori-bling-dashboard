import { describe, expect, it } from "bun:test";
import { normalizeAccessList } from "../src/lib/user-access";
import { profitCentreLabel, profitCentreOptions } from "../src/lib/sd-live";

describe("profit centre access and labels", () => {
  it("all master values ticked is stored as All (empty)", () => {
    expect(normalizeAccessList(["A", "B"], ["A", "B"])).toEqual([]);
    expect(normalizeAccessList(["1100", "1200"], ["1000", "1100", "1200"])).toEqual(["1100", "1200"]);
  });
  it("labels profit centres as PRCTR — LTEXT", () => {
    expect(profitCentreLabel("PGNLB11001", "NLB Batteries")).toBe("PGNLB11001 — NLB Batteries");
    expect(profitCentreLabel("PGNLB11001", "")).toBe("PGNLB11001");
    expect(profitCentreOptions([{ profitCtr: "X1", profitCtrName: "Desc" }, { profitCtr: "X1", profitCtrName: "Desc" }])).toEqual([{ value: "X1", label: "X1 — Desc" }]);
  });
});
