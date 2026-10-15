import type { OpenSalesOrder } from "./open-sales-orders-data";

export type PlantPending = { code: string; name: string; value: number; quantity: number; count: number };

export function summarizePlantPending(rows: Pick<OpenSalesOrder, "order" | "plant" | "plantName" | "value" | "openQuantity">[]): PlantPending[] {
  const plants = new Map<string, PlantPending & { orders: Set<string> }>();
  for (const row of rows) {
    const code = row.plant.trim();
    const current = plants.get(code) ?? { code, name: row.plantName.trim(), value: 0, quantity: 0, count: 0, orders: new Set<string>() };
    if (!current.name) current.name = row.plantName.trim();
    current.value += row.value;
    current.quantity += row.openQuantity;
    current.orders.add(row.order);
    plants.set(code, current);
  }
  return [...plants.values()].map(({ orders, ...plant }) => ({ ...plant, count: orders.size }))
    .sort((a, b) => b.value - a.value || a.code.localeCompare(b.code));
}