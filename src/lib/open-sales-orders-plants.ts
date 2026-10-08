import type { OpenSalesOrder } from "./open-sales-orders-data";

export type PlantPending = { code: string; name: string; value: number; quantity: number; count: number };

export function summarizePlantPending(rows: Pick<OpenSalesOrder, "plant" | "plantName" | "value" | "openQuantity">[]): PlantPending[] {
  const plants = new Map<string, PlantPending>();
  for (const row of rows) {
    const code = row.plant.trim();
    const current = plants.get(code) ?? { code, name: row.plantName.trim(), value: 0, quantity: 0, count: 0 };
    if (!current.name) current.name = row.plantName.trim();
    current.value += row.value;
    current.quantity += row.openQuantity;
    current.count += 1;
    plants.set(code, current);
  }
  return [...plants.values()].sort((a, b) => b.value - a.value || a.code.localeCompare(b.code));
}