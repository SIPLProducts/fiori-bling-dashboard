/**
 * SAP data provider (server-only).
 *
 * Two implementations behind one interface:
 *  - "mock"  — deterministic generated dataset (active by default)
 *  - "odata" — live S/4HANA OData reads (activates once SAP_ODATA_BASE_URL is set)
 *
 * Switching providers requires no UI change: every report reads through
 * the functions exported here.
 */
import {
  categorySpend,
  kpiValues,
  purchaseOrderItems,
  spendTrend,
  supplierScorecards,
  topSuppliers,
  type CategorySpend,
  type PurchaseOrderItem,
  type SpendPoint,
  type SupplierScorecard,
  type SupplierSpend,
} from "./sap-mock";

export type ProviderMode = "mock" | "odata";

export function providerMode(): ProviderMode {
  return process.env["SAP_ODATA_BASE_URL"] ? "odata" : "mock";
}

/** Basic-auth or API-key headers for the SAP gateway. */
function sapHeaders(): HeadersInit {
  const apiKey = process.env["SAP_API_KEY"];
  const user = process.env["SAP_ODATA_USER"];
  const pass = process.env["SAP_ODATA_PASSWORD"];
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers["APIKey"] = apiKey;
  if (user && pass) headers["Authorization"] = `Basic ${btoa(`${user}:${pass}`)}`;
  return headers;
}

async function odataGet<T>(entitySet: string, query: Record<string, string>): Promise<T[]> {
  const base = process.env["SAP_ODATA_BASE_URL"]!.replace(/\/$/, "");
  const url = new URL(`${base}/${entitySet}`);
  url.searchParams.set("$format", "json");
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);

  const res = await fetch(url, { headers: sapHeaders() });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SAP OData request failed [${res.status}] ${entitySet}: ${body.slice(0, 400)}`);
  }
  const json = (await res.json()) as { d?: { results?: T[] }; value?: T[] };
  return json.value ?? json.d?.results ?? [];
}

export async function getSpendTrend(): Promise<SpendPoint[]> {
  if (providerMode() === "mock") return spendTrend();
  // Live: aggregate A_PurchaseOrderItem net amounts by calendar month.
  const rows = await odataGet<{ CalendarMonth: string; NetAmount: string; SavingsAmount?: string }>(
    "A_PurchaseOrderItem",
    { $select: "CalendarMonth,NetAmount", $top: "5000" },
  );
  const byMonth = new Map<string, SpendPoint>();
  for (const row of rows) {
    const point = byMonth.get(row.CalendarMonth) ?? { month: row.CalendarMonth, spend: 0, savings: 0 };
    point.spend += Number(row.NetAmount ?? 0);
    point.savings += Number(row.SavingsAmount ?? 0);
    byMonth.set(row.CalendarMonth, point);
  }
  return [...byMonth.values()];
}

export async function getCategorySpend(): Promise<CategorySpend[]> {
  if (providerMode() === "mock") return categorySpend();
  const rows = await odataGet<{ MaterialGroupName: string; NetAmount: string }>("A_PurchaseOrderItem", {
    $select: "MaterialGroupName,NetAmount",
    $top: "5000",
  });
  const byCategory = new Map<string, number>();
  for (const row of rows) {
    byCategory.set(row.MaterialGroupName, (byCategory.get(row.MaterialGroupName) ?? 0) + Number(row.NetAmount ?? 0));
  }
  return [...byCategory.entries()]
    .map(([category, spend]) => ({ category, spend }))
    .sort((a, b) => b.spend - a.spend);
}

export async function getTopSuppliers(limit = 8): Promise<SupplierSpend[]> {
  if (providerMode() === "mock") return topSuppliers(limit);
  const suppliers = await getSupplierScorecards();
  return suppliers
    .map((s) => ({ supplier: s.supplier, spend: s.spend, orders: s.openOrders }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, limit);
}

export async function getPurchaseOrderItems(): Promise<PurchaseOrderItem[]> {
  if (providerMode() === "mock") return purchaseOrderItems();
  const rows = await odataGet<Record<string, string>>("A_PurchaseOrderItem", {
    $select:
      "PurchaseOrder,PurchaseOrderItem,SupplierName,Material,MaterialGroupName,Plant,OrderQuantity,PurchaseOrderQuantityUnit,NetAmount,DocumentCurrency,ScheduleLineDeliveryDate,PurchasingDocumentStatus",
    $top: "1000",
  });
  return rows.map((row) => ({
    poNumber: row["PurchaseOrder"] ?? "",
    item: row["PurchaseOrderItem"] ?? "",
    supplier: row["SupplierName"] ?? "",
    material: row["Material"] ?? "",
    category: row["MaterialGroupName"] ?? "",
    plant: row["Plant"] ?? "",
    quantity: Number(row["OrderQuantity"] ?? 0),
    unit: row["PurchaseOrderQuantityUnit"] ?? "",
    netValue: Number(row["NetAmount"] ?? 0),
    currency: row["DocumentCurrency"] ?? "EUR",
    deliveryDate: (row["ScheduleLineDeliveryDate"] ?? "").slice(0, 10),
    status: (row["PurchasingDocumentStatus"] as PurchaseOrderItem["status"]) ?? "Open",
  }));
}

export async function getSupplierScorecards(): Promise<SupplierScorecard[]> {
  if (providerMode() === "mock") return supplierScorecards();
  const rows = await odataGet<Record<string, string>>("A_Supplier", {
    $select: "SupplierName,Country",
    $top: "500",
  });
  return rows.map((row) => ({
    supplier: row["SupplierName"] ?? "",
    country: row["Country"] ?? "",
    overall: Number(row["OverallScore"] ?? 0),
    quality: Number(row["QualityScore"] ?? 0),
    delivery: Number(row["DeliveryScore"] ?? 0),
    price: Number(row["PriceScore"] ?? 0),
    onTimePct: Number(row["OnTimeDeliveryPercent"] ?? 0),
    spend: Number(row["TotalSpend"] ?? 0),
    openOrders: Number(row["OpenOrderCount"] ?? 0),
  }));
}

export async function getKpiValues() {
  if (providerMode() === "mock") return kpiValues();
  const [trend, items, suppliers] = await Promise.all([
    getSpendTrend(),
    getPurchaseOrderItems(),
    getSupplierScorecards(),
  ]);
  return {
    total_spend: { value: Math.round(trend.reduce((s, p) => s + p.spend, 0) / 1_000_000), unit: "M EUR" },
    po_overdue: { value: items.filter((i) => i.status === "Overdue").length, footer: "Overdue" },
    avg_supplier_score: {
      value: suppliers.length
        ? Math.round((suppliers.reduce((s, x) => s + x.overall, 0) / suppliers.length) * 10) / 10
        : 0,
      unit: "/ 100",
    },
  } as Record<string, { value: number; unit?: string; footer?: string; trend?: number[] }>;
}
