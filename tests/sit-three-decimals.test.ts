import { expect, test } from "vitest";
import { formatSit3 } from "../src/lib/format";
test("SIT value 265,432,100 shows as 26.543 Cr", () => { expect(formatSit3(265_432_100 / 10_000_000)).toBe("26.543"); });
test("SIT LAH 1,234,567 AH shows as 12.346", () => { expect(formatSit3(1_234_567 / 100_000)).toBe("12.346"); });
