import { describe, expect, test } from "bun:test";
import { summarizeOpenOrderGroups } from "../src/lib/open-orders-groups";

describe("summarizeOpenOrderGroups", () => {
  const rows = [
    { order: "1", value: 2, division: "19", g: "A" },
    { order: "1", value: 1, division: "05", g: "A" },
    { order: "2", value: 5, division: "19", g: "B" },
    { order: "3", value: 9, division: "19", g: "" },
  ];
  const out = summarizeOpenOrderGroups(rows, (r) => r.g);
  test("counts distinct orders per group", () => expect(out.find((g) => g.name === "A")?.orders).toBe(1));
  test("lists related divisions", () => expect(out.find((g) => g.name === "A")?.divisions).toEqual(["05", "19"]));
  test("sorts by value and skips blank groups", () => expect(out.map((g) => g.name)).toEqual(["B", "A"]));
});
