import { describe, expect, it } from "vitest";
import { formatBookLah } from "../src/lib/open-sales-orders-table";
import { summarizeGroupsByDivision } from "../src/lib/open-orders-groups";

describe("Order Book Total LAH rounding", () => {
  it("keeps decimals at .49 or less", () => {
    expect(formatBookLah(104_140_000)).toBe("1,041.40");
    expect(formatBookLah(104_149_000)).toBe("1,041.49");
  });
  it("rounds off above .49", () => expect(formatBookLah(104_150_000)).toBe("1,042"));
});

describe("Sub group by division", () => {
  it("splits value and distinct orders per division", () => {
    const r = summarizeGroupsByDivision([
      { order: "1", value: 2, division: "VZNM", subGroup: "BATTERY" },
      { order: "1", value: 1, division: "VZNM", subGroup: "BATTERY" },
      { order: "2", value: 4, division: "NCPP", subGroup: "BATTERY" },
    ], (x) => x.subGroup);
    expect(r.groups[0]).toMatchObject({ name: "BATTERY", value: 7, orders: 2 });
    expect(r.groups[0]!.parts["VZNM"]).toEqual({ value: 3, orders: 1 });
    expect(r.divisions).toEqual(["NCPP", "VZNM"]);
  });
});
