/**
 * Deterministic mock SAP procurement dataset.
 * Shapes mirror what the OData provider returns, so swapping providers
 * requires no UI changes.
 */

export type SpendPoint = { month: string; spend: number; savings: number };
export type CategorySpend = { category: string; spend: number };
export type SupplierSpend = { supplier: string; spend: number; orders: number };
export type PurchaseOrderItem = {
  poNumber: string;
  item: string;
  supplier: string;
  material: string;
  category: string;
  plant: string;
  quantity: number;
  unit: string;
  netValue: number;
  currency: string;
  deliveryDate: string;
  status: "Open" | "Confirmed" | "Partially Delivered" | "Delivered" | "Overdue";
};
export type SupplierScorecard = {
  supplier: string;
  country: string;
  overall: number;
  quality: number;
  delivery: number;
  price: number;
  onTimePct: number;
  spend: number;
  openOrders: number;
};

const SUPPLIERS = [
  ["Nordwind Industrie GmbH", "DE"],
  ["Castellan Components SA", "FR"],
  ["Hokuriku Precision KK", "JP"],
  ["Brightline Materials Ltd", "GB"],
  ["Vantar Steel AB", "SE"],
  ["Delta Ridge Manufacturing", "US"],
  ["Alpine Fasteners AG", "CH"],
  ["Sagara Polymers Pvt Ltd", "IN"],
  ["Ceres Chemicals BV", "NL"],
  ["Ironhall Foundry Inc", "US"],
  ["Meridian Electricals Ltd", "GB"],
  ["Okabe Tooling KK", "JP"],
  ["Lumen Optics SpA", "IT"],
  ["Baltic Cable OU", "EE"],
  ["Perihelion Bearings SL", "ES"],
  ["Kestrel Packaging Oy", "FI"],
  ["Granite Peak Logistics", "CA"],
  ["Aurora Sensors Pty", "AU"],
  ["Verdant Coatings Sdn", "MY"],
  ["Solaris Hydraulics GmbH", "DE"],
] as const;

const CATEGORIES = [
  "Raw Materials",
  "Components",
  "MRO Supplies",
  "Packaging",
  "Logistics",
  "IT Hardware",
  "Professional Services",
];

const PLANTS = ["1010 Hamburg", "1710 Chicago", "2210 Lyon", "3310 Osaka", "4410 Pune"];
const UNITS = ["EA", "KG", "M", "L", "PC"];
const STATUSES: PurchaseOrderItem["status"][] = [
  "Open",
  "Confirmed",
  "Partially Delivered",
  "Delivered",
  "Overdue",
];

/** Mulberry32 — small deterministic PRNG so every render shows identical data. */
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
    out.push(`${d.toLocaleString("en", { month: "short", timeZone: "UTC" })} ${String(d.getUTCFullYear()).slice(2)}`);
  }
  return out;
}

export function spendTrend(): SpendPoint[] {
  const r = rng(41);
  return monthLabels(12).map((month, i) => {
    const base = 3_950_000 + i * 78_000;
    const spend = Math.round(base * (0.88 + r() * 0.26));
    return { month, spend, savings: Math.round(spend * (0.031 + r() * 0.028)) };
  });
}

export function categorySpend(): CategorySpend[] {
  const r = rng(77);
  return CATEGORIES.map((category) => ({
    category,
    spend: Math.round(1_400_000 + r() * 7_600_000),
  })).sort((a, b) => b.spend - a.spend);
}

export function purchaseOrderItems(): PurchaseOrderItem[] {
  const r = rng(1337);
  const items: PurchaseOrderItem[] = [];
  for (let i = 0; i < 500; i++) {
    const [supplier] = SUPPLIERS[Math.floor(r() * SUPPLIERS.length)]!;
    const qty = Math.round(5 + r() * 900);
    const price = 12 + r() * 640;
    const dayOffset = Math.round(-150 + r() * 240);
    const date = new Date(Date.UTC(2026, 7, 8) + dayOffset * 86400000);
    items.push({
      poNumber: `45${String(100000 + Math.floor(r() * 899999)).slice(0, 6)}`,
      item: String((i % 9) * 10 + 10),
      supplier,
      material: `MAT-${String(Math.floor(r() * 90000) + 10000)}`,
      category: CATEGORIES[Math.floor(r() * CATEGORIES.length)]!,
      plant: PLANTS[Math.floor(r() * PLANTS.length)]!,
      quantity: qty,
      unit: UNITS[Math.floor(r() * UNITS.length)]!,
      netValue: Math.round(qty * price),
      currency: "EUR",
      deliveryDate: date.toISOString().slice(0, 10),
      status: STATUSES[Math.floor(r() * STATUSES.length)]!,
    });
  }
  return items;
}

export function supplierScorecards(): SupplierScorecard[] {
  const r = rng(909);
  return SUPPLIERS.map(([supplier, country]) => {
    const quality = Math.round(48 + r() * 51);
    const delivery = Math.round(45 + r() * 54);
    const price = Math.round(50 + r() * 49);
    return {
      supplier,
      country,
      quality,
      delivery,
      price,
      overall: Math.round((quality * 0.4 + delivery * 0.35 + price * 0.25) * 10) / 10,
      onTimePct: Math.round(62 + r() * 37),
      spend: Math.round(320_000 + r() * 4_200_000),
      openOrders: Math.round(2 + r() * 48),
    };
  }).sort((a, b) => b.overall - a.overall);
}

export function topSuppliers(limit = 8): SupplierSpend[] {
  return supplierScorecards()
    .map((s) => ({ supplier: s.supplier, spend: s.spend, orders: s.openOrders }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, limit);
}

/** KPI values keyed by the `kpi_key` stored on each launchpad tile. */
export function kpiValues(): Record<string, { value: number; unit?: string; footer?: string; trend?: number[] }> {
  const trend = spendTrend();
  const items = purchaseOrderItems();
  const scores = supplierScorecards();
  const overdue = items.filter((i) => i.status === "Overdue").length;
  const openValue = items
    .filter((i) => i.status === "Open")
    .reduce((sum, i) => sum + i.netValue, 0);

  return {
    total_spend: {
      value: Math.round(trend.reduce((s, p) => s + p.spend, 0) / 1_000_000),
      unit: "M EUR",
      footer: "Rolling 12 months",
    },
    savings: {
      value: Math.round(trend.reduce((s, p) => s + p.savings, 0) / 1000),
      unit: "K EUR",
      footer: "Realized savings",
    },
    spend_trend: { value: Math.round(trend[trend.length - 1]!.spend / 1000), unit: "K EUR", footer: "Monthly spend", trend: trend.map((p) => p.spend) },
    po_value_trend: { value: items.length, unit: "items", footer: "Order value trend", trend: trend.map((p) => Math.round(p.spend * 0.72)) },
    po_overdue: { value: overdue, footer: "Overdue" },
    pending_confirmations: { value: items.filter((i) => i.status === "Open").length, footer: "Pending Confirmations" },
    open_requisitions: { value: 148, footer: "Awaiting conversion" },
    requisition_value: { value: Math.round(openValue / 1000), unit: "K EUR", footer: "Open value" },
    pending_approvals: { value: 23, footer: "Assigned to me" },
    avg_approval_time: { value: 1.8, unit: "days", footer: "Last 30 days" },
    avg_supplier_score: {
      value: Math.round((scores.reduce((s, x) => s + x.overall, 0) / scores.length) * 10) / 10,
      unit: "/ 100",
      footer: "All active suppliers",
    },
    on_time_delivery: {
      value: Math.round(scores.reduce((s, x) => s + x.onTimePct, 0) / scores.length),
      unit: "%",
      footer: "Last 90 days",
    },
    suppliers_at_risk: { value: scores.filter((s) => s.overall < 60).length, footer: "Score below 60" },
    active_contracts: { value: 87, footer: "Currently valid" },
    contracts_expiring: { value: 12, footer: "Next 90 days" },
  };
}

export const supplierNames = SUPPLIERS.map(([name]) => name);
export const plantNames = [...PLANTS];
export const statusNames = [...STATUSES];
export const categoryNames = [...CATEGORIES];
