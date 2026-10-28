import { expect, test } from "bun:test";
import { PERMISSION_MODULES } from "../src/lib/screens";

test("Production Planning has only Daily Production Report", () => {
  const pp = (PERMISSION_MODULES as any[]).find((m) => m.key === "module.pp");
  expect(pp.children.map((c: any) => c.key)).toEqual(["pp.daily-production-report"]);
});
