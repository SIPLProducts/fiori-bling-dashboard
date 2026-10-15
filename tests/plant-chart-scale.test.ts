import { describe, expect, test } from "bun:test";
import { plantChartMaximum, plantLabelLayout } from "../src/lib/plant-chart-scale";

describe("plant chart actual-value scales", () => {
  test("currency axis retains crore values rather than converting to percentages", () => {
    expect(plantChartMaximum([51.32, 0.15])).toBe(55);
  });
  test("quantity axis retains actual units", () => {
    expect(plantChartMaximum([17744, 28])).toBe(20000);
  });
  test("line axis retains actual counts", () => {
    expect(plantChartMaximum([291, 9])).toBe(300);
  });
  test("empty scales have a finite nonzero domain", () => {
    expect(plantChartMaximum([])).toBe(1);
  });
});

describe("diagonal plant-name axis", () => {
  test("long plant names keep all their characters when the column is wide enough", () => {
    expect(plantLabelLayout(["HBL VIZIANAGARAM", "HBL MUN"], 56)).toEqual({ chars: 16, height: 105 });
  });
  test("tight columns shorten names and reserve less bottom space", () => {
    expect(plantLabelLayout(["HBL VIZIANAGARAM"], 24)).toEqual({ chars: 15, height: 100 });
  });
  test("names longer than the readable limit are cut at eighteen characters", () => {
    expect(plantLabelLayout(["HBL INTERNATIONAL DIVISION"], 60)).toEqual({ chars: 18, height: 115 });
  });
  test("the axis grows with the name length and stays finite when no plant matches", () => {
    expect(plantLabelLayout(["ABCDEFGHIJKLMNOP"], 60).height).toBeGreaterThan(plantLabelLayout(["ABCDE"], 60).height);
    expect(plantLabelLayout([], 60)).toEqual({ chars: 4, height: 41 });
  });
});