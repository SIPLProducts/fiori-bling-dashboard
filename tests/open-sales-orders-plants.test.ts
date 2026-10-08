import { describe, expect, test } from "bun:test";
import { summarizePlantPending } from "../src/lib/open-sales-orders-plants";

const rows = [
  { plant: "1100", plantName: "Works", value: 2.5, openQuantity: 4.5 },
  { plant: "1100", plantName: "Works", value: 1.25, openQuantity: 2 },
  { plant: "1200", plantName: "Works", value: 5, openQuantity: 8 },
  { plant: "", plantName: "", value: 0, openQuantity: 1 },
];

describe("Plant-wise Pending", () => {
  test("groups by code, keeps same-name plants distinct, and ranks every plant", () => {
    expect(summarizePlantPending(rows)).toEqual([
      { code: "1200", name: "Works", value: 5, quantity: 8, count: 1 },
      { code: "1100", name: "Works", value: 3.75, quantity: 6.5, count: 2 },
      { code: "", name: "", value: 0, quantity: 1, count: 1 },
    ]);
  });
  test("reconciles all three totals and applies the provided filtered subset", () => {
    const plants = summarizePlantPending(rows);
    expect(plants.reduce((s, p) => s + p.value, 0)).toBe(8.75);
    expect(plants.reduce((s, p) => s + p.quantity, 0)).toBe(15.5);
    expect(plants.reduce((s, p) => s + p.count, 0)).toBe(4);
    expect(summarizePlantPending(rows.filter(r => r.plant === "1100"))).toHaveLength(1);
    expect(summarizePlantPending([])).toEqual([]);
  });
});