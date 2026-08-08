/**
 * Deterministic mock datasets for the non-procurement SAP modules
 * (SD, FI, CO, PP, QM, PS). Same shape the OData provider will return.
 */
import { MODULES, findModule, type ModuleDef } from "./sap-modules";

export type ModuleTrendPoint = { month: string; primary: number; secondary: number };
export type ModuleBreakdown = { name: string; value: number };
export type ModuleRow = {
  document: string;
  partner: string;
  dimension: string;
  site: string;
  quantity: number;
  value: number;
  date: string;
  status: string;
};
export type ModuleReport = {
  key: string;
  title: string;
  code: string;
  description: string;
  trendLabel: string;
  secondaryLabel: string;
  breakdownLabel: string;
  columns: ModuleDef["columns"];
  kpis: { key: string; label: string; unit?: string; value: number; subtitle: string }[];
  trend: ModuleTrendPoint[];
  breakdown: ModuleBreakdown[];
  rows: ModuleRow[];
};

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function monthLabels(count: number): string[] {
  const now = new Date(Date.UTC(2026, 7, 1));
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push(
      `${d.toLocaleString("en", { month: "short", timeZone: "UTC" })} ${String(d.getUTCFullYear()).slice(2)}`,
    );
  }
  return out;
}

const PARTNERS = [
  "Helios Retail Group",
  "Northgate Motors",
  "Ariva Systems",
  "Bluestone Energy",
  "Cascade Foods",
  "Draco Aerospace",
  "Eurotech Mobility",
  "Fjord Marine",
  "Granova Pharma",
  "Halden Robotics",
  "Ivory Labs",
  "Juno Utilities",
];

function moduleTrend(def: ModuleDef): ModuleTrendPoint[] {
  const r = rng(def.seed);
  const base = def.kpis.find((k) => k.kind === "chart")?.base ?? 1000;
  return monthLabels(12).map((month, i) => {
    const drift = 1 + (i - 6) * 0.012;
    const primary = Math.round(base * drift * (0.86 + r() * 0.3));
    const secondary = Math.round(primary * (0.82 + r() * 0.32));
    return { month, primary, secondary };
  });
}

function moduleBreakdown(def: ModuleDef): ModuleBreakdown[] {
  const r = rng(def.seed + 13);
  return def.dimensions
    .map((name) => ({ name, value: Math.round(240_000 + r() * 3_400_000) }))
    .sort((a, b) => b.value - a.value);
}

function moduleRows(def: ModuleDef): ModuleRow[] {
  const r = rng(def.seed + 29);
  const rows: ModuleRow[] = [];
  for (let i = 0; i < 60; i++) {
    const day = Math.round(-120 + r() * 210);
    const date = new Date(Date.UTC(2026, 7, 8) + day * 86_400_000);
    rows.push({
      document: `${def.documentPrefix}${String(100000 + Math.floor(r() * 899999))}`,
      partner: PARTNERS[Math.floor(r() * PARTNERS.length)]!,
      dimension: def.dimensions[Math.floor(r() * def.dimensions.length)]!,
      site: def.dimensions[Math.floor(r() * def.dimensions.length)]!,
      quantity: Math.round(1 + r() * 480),
      value: Math.round(4_000 + r() * 940_000),
      date: date.toISOString().slice(0, 10),
      status: def.statuses[Math.floor(r() * def.statuses.length)]!,
    });
  }
  return rows;
}

/** KPI values for every module tile, keyed by the tile's `kpi_key`. */
export function moduleKpiValues(): Record<
  string,
  { value: number; unit?: string; footer?: string; trend?: number[] }
> {
  const out: Record<string, { value: number; unit?: string; footer?: string; trend?: number[] }> = {};
  for (const def of MODULES) {
    const trend = moduleTrend(def);
    const r = rng(def.seed + 7);
    for (const kpi of def.kpis) {
      const jitter = 0.94 + r() * 0.12;
      const raw = kpi.base * jitter;
      const value = kpi.decimals ? Math.round(raw * 10) / 10 : Math.round(raw);
      out[kpi.key] = {
        value: kpi.kind === "chart" ? trend[trend.length - 1]!.primary : value,
        ...(kpi.unit ? { unit: kpi.unit } : {}),
        footer: kpi.subtitle,
        ...(kpi.kind === "chart" ? { trend: trend.map((p) => p.primary) } : {}),
      };
    }
  }
  return out;
}

export function moduleReport(key: string): ModuleReport | null {
  const def = findModule(key);
  if (!def) return null;
  const kpiValues = moduleKpiValues();
  return {
    key: def.key,
    title: def.title,
    code: def.code,
    description: def.description,
    trendLabel: def.trendLabel,
    secondaryLabel: def.secondaryLabel,
    breakdownLabel: def.breakdownLabel,
    columns: def.columns,
    kpis: def.kpis.map((k) => ({
      key: k.key,
      label: k.label,
      ...(k.unit ? { unit: k.unit } : {}),
      value: kpiValues[k.key]?.value ?? k.base,
      subtitle: k.subtitle,
    })),
    trend: moduleTrend(def),
    breakdown: moduleBreakdown(def),
    rows: moduleRows(def),
  };
}
