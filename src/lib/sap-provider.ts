import { SALES_ROWS } from "./zfisales-data";
/**
 * SAP data provider (browser-safe).
 *
 * The portal ships as a static SPA, so this module runs in the browser and
 * serves the deterministic sample dataset. Live S/4HANA OData reads are done
 * by the middleware service (never from the browser, so SAP credentials are
 * never exposed) and plug in behind the same function signatures.
 */
import { moduleKpiValues, moduleReport, type ModuleReport } from "./sap-mock-modules";

export type ProviderMode = "mock" | "odata";

export function providerMode(): ProviderMode {
  return "mock";
}

/** Analytical report for one supported SAP module (SD, FI, PP). */
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
  return { ...moduleKpiValues(), ...salesRegisterKpis() };
}
