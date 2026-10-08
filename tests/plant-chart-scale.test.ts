import { describe, expect, test } from "bun:test";
import { plantChartMaximum } from "../src/lib/plant-chart-scale";

describe("plant chart actual-value scales", () => {
  test("currency axis retains crore values rather than converting to percentages", () => {
    expect(plantChartMaximum([51.32, 0.15])).toBe(55);
  });
  test("quantity axis retains actual units", () => {
    expect(plantChartMaximum([17744, 28])).toBe(18000);
  });
  test("line axis retains actual counts", () => {
    expect(plantChartMaximum([291, 9])).toBe(300);
  });
  test("empty scales have a finite nonzero domain", () => {
    expect(plantChartMaximum([])).toBe(1);
  });
});