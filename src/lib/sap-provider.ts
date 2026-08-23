import { SALES_ROWS } from "./zfisales-data";
/**
 * SAP data provider (browser-safe).
 *
 * The portal ships as a static SPA, so this module runs in the browser and
 * serves the deterministic sample dataset. Live S/4HANA OData reads are done
 * by the middleware service (never from the browser, so SAP credentials are
 * never exposed) and plug in behind the same function signatures.
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
import { moduleKpiValues, moduleReport, type ModuleReport } from "./sap-mock-modules";

export type ProviderMode = "mock" | "odata";

export function providerMode(): ProviderMode {
  return "mock";
}

export async function getSpendTrend(): Promise<SpendPoint[]> {
  return spendTrend();
}

export async function getCategorySpend(): Promise<CategorySpend[]> {
  return categorySpend();
}

export async function getTopSuppliers(limit = 8): Promise<SupplierSpend[]> {
  return topSuppliers(limit);
}

export async function getPurchaseOrderItems(): Promise<PurchaseOrderItem[]> {
  return purchaseOrderItems();
}

export async function getSupplierScorecards(): Promise<SupplierScorecard[]> {
  return supplierScorecards();
}

/** Analytical report for one SAP module (SD, FI, CO, PP, QM, PS). */
export async function getModuleReportData(key: string): Promise<ModuleReport | null> {
  return moduleReport(key);
}

/** Sales-register KPIs surfaced as launchpad tiles. */
function salesRegisterKpis() {
  const revenue = SALES_ROWS.reduce((s, r) => s + r.amount, 0);
  const months = new Map<string, number>();
  for (const row of SALES_ROWS) months.set(row.month, (months.get(row.month) ?? 0) + row.amount);
  return {
    zfi_sales_revenue: {
      value: Math.round((revenue / 10_000_000) * 100) / 100,
      unit: "Cr INR",
      footer: "Billed revenue",
    },
    zfi_sales_trend: {
      value: new Set(SALES_ROWS.map((r) => r.docNo)).size,
      footer: "Billing documents by month",
      trend: [...months.values()].map((v) => Math.round(v / 100000)),
    },
  };
}

export async function getKpiValues(): Promise<
  Record<string, { value: number; unit?: string; footer?: string; trend?: number[] }>
> {
  return { ...kpiValues(), ...moduleKpiValues(), ...salesRegisterKpis() };
}
