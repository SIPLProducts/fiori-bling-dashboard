import type { ModelPerformance, TypePerformance } from "@/lib/sd-live";

export type ModelInput = { model?: string | undefined; type?: string | undefined; amount: number; ah?: number | undefined };

const key = (v?: string) => (v ?? "").trim();

/** Rank models by amount (desc) with ₹/AH realization; blank model → "Unassigned". */
export function rankModels(rows: ModelInput[]): ModelPerformance[] {
  const total = rows.filter((r) => key(r.model)).reduce((s, r) => s + r.amount, 0);
  const m = new Map<string, ModelPerformance>();
  for (const r of rows) {
    const k = key(r.model); if (!k) continue;
    const p = m.get(k) ?? { model: k, totalAmount: 0, totalAh: 0, perAhRate: 0, recordCount: 0, salesSharePct: 0 };
    p.totalAmount += r.amount; p.totalAh += r.ah ?? 0; p.recordCount += 1; m.set(k, p);
  }
  return [...m.values()].map((p) => ({ ...p, perAhRate: p.totalAh ? p.totalAmount / p.totalAh : 0, salesSharePct: total ? (p.totalAmount / total) * 100 : 0 }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

/** Rank types by amount (desc); blank type → "Unassigned". */
export function rankTypes(rows: ModelInput[]): TypePerformance[] {
  const total = rows.filter((r) => key(r.type)).reduce((s, r) => s + r.amount, 0);
  const m = new Map<string, TypePerformance>();
  for (const r of rows) {
    const k = key(r.type); if (!k) continue;
    const p = m.get(k) ?? { type: k, totalAmount: 0, recordCount: 0, salesSharePct: 0 };
    p.totalAmount += r.amount; p.recordCount += 1; m.set(k, p);
  }
  return [...m.values()].map((p) => ({ ...p, salesSharePct: total ? (p.totalAmount / total) * 100 : 0 }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}
