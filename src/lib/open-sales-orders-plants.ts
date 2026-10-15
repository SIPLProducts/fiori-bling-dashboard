import type { OpenSalesOrder } from "./open-sales-orders-data";

export type PlantPending = { code: string; name: string; value: number; quantity: number; count: number; divisions: string[] };

type PlantRow = Pick<OpenSalesOrder, "order" | "plant" | "plantName" | "value" | "openQuantity" | "division" | "industryDescription">;

/** Groups rows by plant; counts distinct order numbers and lists the divisions each plant's lines relate to. Sorted by value desc. */
export function summarizePlantPending(rows: PlantRow[]): PlantPending[] {
  const plants = new Map<string, { code: string; name: string; value: number; quantity: number; orders: Set<string>; divisions: Set<string> }>();
  for (const row of rows) {
    const code = row.plant.trim();
    const current = plants.get(code) ?? { code, name: row.plantName.trim(), value: 0, quantity: 0, orders: new Set<string>(), divisions: new Set<string>() };
    if (!current.name) current.name = row.plantName.trim();
    current.value += row.value;
    current.quantity += row.openQuantity;
    current.orders.add(row.order);
    const division = row.division?.trim();
    if (division && division !== "Unassigned") current.divisions.add(row.industryDescription?.trim() ? `${division} — ${row.industryDescription.trim()}` : division);
    plants.set(code, current);
  }
  return [...plants.values()]
    .map(({ orders, divisions, ...plant }) => ({ ...plant, count: orders.size, divisions: [...divisions].sort() }))
    .sort((a, b) => b.value - a.value || a.code.localeCompare(b.code));
}
