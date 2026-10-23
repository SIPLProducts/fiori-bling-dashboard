import { describe, expect, it } from "vitest";
import { rankModels, rankTypes } from "../src/lib/model-performance";

describe("model performance", () => {
  const rows = [{ model: "KPL", type: "L", amount: 200, ah: 10 }, { model: "", type: "", amount: 50, ah: 5 }, { model: "KPL", type: "L", amount: 100, ah: 5 }];
  it("ranks models with ₹/AH, skipping blank models", () => {
    const m = rankModels(rows);
    expect(m[0]).toMatchObject({ model: "KPL", totalAmount: 300, totalAh: 15, perAhRate: 20, recordCount: 2 });
    expect(m.length).toBe(1);
  });
  it("ranks types", () => {
    expect(rankTypes(rows).map((t) => t.type)).toEqual(["L"]);
  });
});
