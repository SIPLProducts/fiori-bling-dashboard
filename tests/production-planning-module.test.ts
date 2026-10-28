import { expect, test } from "bun:test";
import { SCREEN_TREE } from "../src/lib/screens";

test("Production Planning has only Daily Production Report", () => {
  const pp = (SCREEN_TREE as any[]).find((m) => m.key === "module.pp");
  expect(pp.children.map((c: any) => c.key)).toEqual(["pp.daily-production-report"]);
});
