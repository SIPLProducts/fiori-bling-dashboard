import { describe, expect, test } from "bun:test";
import { summarizePlantPending } from "../src/lib/open-sales-orders-plants";

const rows = [
  { order: "7001", plant: "1100", plantName: "Works", value: 2.5, openQuantity: 4.5, division: "VZM", industryDescription: "VRLA" },
  { order: "7001", plant: "1100", plantName: "Works", value: 1.25, openQuantity: 2, division: "VZM", industryDescription: "Scrap" },
  { order: "7002", plant: "1200", plantName: "Plant B", value: 5, openQuantity: 8, division: "VZM", industryDescription: "VRLA" },
  { order: "7003", plant: "", plantName: "", value: 0, openQuantity: 1, division: "", industryDescription: "" },
];

describe("Plant-wise Pending", () => {
  test("groups by code, counts unique orders, ranks every plant, and lists each division once", () => {
    expect(summarizePlantPending(rows)).toEqual([
      { code: "1200", name: "Plant B", value: 5, quantity: 8, count: 1, divisions: ["VZM — VRLA"] },
      { code: "1100", name: "Works", value: 3.75, quantity: 6.5, count: 1, divisions: ["VZM — Scrap", "VZM — VRLA"] },
      { code: "", name: "", value: 0, quantity: 1, count: 1, divisions: [] },
    ]);
  });
  test("reconciles all three totals and applies the provided filtered subset", () => {
    const plants = summarizePlantPending(rows);
    expect(plants.reduce((s, p) => s + p.value, 0)).toBe(8.75);
    expect(plants.reduce((s, p) => s + p.quantity, 0)).toBe(15.5);
    expect(plants.reduce((s, p) => s + p.count, 0)).toBe(3);
    expect(summarizePlantPending(rows.filter(r => r.plant === "1100"))).toHaveLength(1);
    expect(summarizePlantPending([])).toEqual([]);
  });
  test("a repeated division across orders is listed once and a bare code shows without a description", () => {
    const plants = summarizePlantPending([...rows,
      { order: "7004", plant: "1200", plantName: "Plant B", value: 1, openQuantity: 1, division: "VZM", industryDescription: "VRLA" },
      { order: "7005", plant: "1200", plantName: "Plant B", value: 1, openQuantity: 1, division: "VZS", industryDescription: "" },
    ]);
    const plantB = plants.find((p) => p.code === "1200");
    expect(plantB?.divisions).toEqual(["VZM — VRLA", "VZS"]);
    expect(plantB?.count).toBe(3);
  });
});
