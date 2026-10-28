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

import { segmentTotals } from "@/lib/industry-name";
describe("segmentTotals", () => {
  it("groups by BRSCH, labels with most common BRTXT, falls back to code, skips blank codes", () => {
    const rows = [
      { c: "001", n: "Defence", v: 5 }, { c: "001", n: "Defence", v: 5 }, { c: "001", n: "Metro", v: 1 },
      { c: "002", n: "", v: 20 }, { c: "", n: "Telecom", v: 99 },
    ];
    expect(segmentTotals(rows, (r) => r.c, (r) => r.n, (r) => r.v)).toEqual([
      { code: "002", name: "002", value: 20, count: 1 },
      { code: "001", name: "Defence", value: 11, count: 3 },
    ]);
  });
});
