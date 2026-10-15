import { describe, expect, test } from "bun:test";
import { groupAxisDecimals } from "../src/lib/open-orders-group-axis";

describe("group chart axis decimals", () => {
  test("uses whole numbers when ticks are at least one apart", () => {
    expect(groupAxisDecimals(11.07)).toBe(0);
    expect(groupAxisDecimals(100)).toBe(0);
  });
  test("uses one decimal so small maxima stay distinguishable", () => {
    expect(groupAxisDecimals(2.4)).toBe(1);
    expect(groupAxisDecimals(0.6)).toBe(1);
  });
  test("uses two decimals for tiny maxima", () => {
    expect(groupAxisDecimals(0.3)).toBe(2);
    expect(groupAxisDecimals(0)).toBe(2);
  });
  test("tolerates non-finite and negative maxima", () => {
    expect(groupAxisDecimals(Number.NaN)).toBe(2);
    expect(groupAxisDecimals(-12)).toBe(0);
  });
});
