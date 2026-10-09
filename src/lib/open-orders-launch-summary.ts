export type LaunchOrderRow = {
  open_value: number | string | null;
  sales_type: string | null;
  order_type: string | null;
};

export type LaunchOrderGroup = { name: string; count: number; value: number; share: number };

export function summarizeLaunchOrders(rows: LaunchOrderRow[]) {
  const groups = new Map<string, LaunchOrderGroup>();
  let openValue = 0;
  for (const row of rows) {
    const description = row.sales_type?.trim();
    const name = description && description !== "Unassigned" ? description : row.order_type || "Unassigned";
    const parsed = Number(row.open_value ?? 0);
    const value = Number.isFinite(parsed) ? parsed : 0;
    const group = groups.get(name) ?? { name, count: 0, value: 0, share: 0 };
    group.count += 1;
    group.value += value;
    groups.set(name, group);
    openValue += value;
  }
  const ranked = [...groups.values()].sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  const breakdown = ranked.slice(0, 3);
  if (ranked.length > 3) {
    breakdown.push(ranked.slice(3).reduce<LaunchOrderGroup>((others, group) => ({
      ...others, count: others.count + group.count, value: others.value + group.value,
    }), { name: "Others", count: 0, value: 0, share: 0 }));
  }
  return {
    count: rows.length,
    openValue,
    breakdown: breakdown.map((group) => ({ ...group, share: openValue > 0 ? Math.max(0, Math.min(100, group.value / openValue * 100)) : 0 })),
  };
}