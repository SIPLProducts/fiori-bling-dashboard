import { expect, test } from "vitest";
import { roundWhole3 } from "../src/lib/format";
test("24.499 rounds to 24", () => expect(roundWhole3(24.499)).toBe(24));
test("24.500 rounds to 25", () => expect(roundWhole3(24.5)).toBe(25));
test("24.495 rounds to 24 (no 2-decimal pre-rounding)", () => expect(roundWhole3(24.495)).toBe(24));
