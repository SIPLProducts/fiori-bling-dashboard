import { expect, test } from "bun:test";
import { PERMISSION_MODULES } from "../src/lib/screens";

test("Purchase module lists its three screens", () => {
  const mod = PERMISSION_MODULES.find((m) => m.key === "module.mm");
  expect(mod?.groupKey).toBe("purchase");
  expect(mod?.children.map((c) => c.key)).toEqual(["mm.purchase-register", "mm.purchase-orders", "mm.open-purchase-orders"]);
});
