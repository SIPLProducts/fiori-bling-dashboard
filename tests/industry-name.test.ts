import { describe, expect, it } from "vitest";
import { industryTotals } from "@/lib/industry-name";

describe("industryTotals", () => {
  it("groups by Industry Name, skips blanks, sorts highest first", () => {
    const rows = [{ i: "Auto", v: 10 }, { i: " Auto ", v: 5 }, { i: "", v: 100 }, { i: "Solar", v: 20 }, { i: "  ", v: 9 }];
    expect(industryTotals(rows, (r) => r.i, (r) => r.v)).toEqual([
      { name: "Solar", value: 20, count: 1 },
      { name: "Auto", value: 15, count: 2 },
    ]);
  });
});
