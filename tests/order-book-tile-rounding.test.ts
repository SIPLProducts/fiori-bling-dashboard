import { expect, test } from "vitest";
import { formatCrWhole, formatBookLahWhole } from "../src/lib/open-sales-orders-table";
test("order value rounds to whole crore", () => expect(formatCrWhole(263.92)).toBe("₹264 Cr"));
test("total LAH rounds to whole lakh", () => expect(formatBookLahWhole(104_140_000)).toBe("1,041"));
