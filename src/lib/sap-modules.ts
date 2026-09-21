/**
 * SAP application modules beyond MM procurement.
 * Client-safe metadata: shared by the launchpad tiles, the module report
 * route and the mock/OData provider so all three stay in sync.
 */

export type ModuleRole = "admin" | "buyer" | "approver" | "viewer";

export type ModuleKey = "sd" | "fi" | "pp";

export type ModuleKpiDef = {
  key: string;
  label: string;
  subtitle: string;
  unit?: string;
  base: number;
  decimals?: number;
  kind: "kpi" | "chart";
  icon: string;
};

export type ModuleDef = {
  key: ModuleKey;
  code: string;
  title: string;
  groupKey: string;
  groupTitle: string;
  description: string;
  seed: number;
  trendLabel: string;
  trendUnit: string;
  secondaryLabel: string;
  breakdownLabel: string;
  dimensions: string[];
  columns: { key: string; label: string; numeric?: boolean }[];
  documentPrefix: string;
  statuses: string[];
  kpis: ModuleKpiDef[];
};

/** Screen permission key for a module report. */
export function moduleScreenKey(moduleKey: string): string {
  return `module.${moduleKey}`;
}

/** Module access is granted through screen permissions on the role. */
export function canAccessModule(moduleKey: string, screens: readonly string[] | undefined): boolean {
  if (!MODULES.some((mod) => mod.key === moduleKey)) return false;
  return (screens ?? []).includes(moduleScreenKey(moduleKey));
}

export function modulesForScreens(screens: readonly string[] | undefined): ModuleDef[] {
  return MODULES.filter((mod) => canAccessModule(mod.key, screens));
}


export const MODULES: ModuleDef[] = [
  {
    key: "sd",
    code: "SD",
    title: "Net Sales",
    groupKey: "sales-distribution",
    groupTitle: "Net Sales",
    description: "",
    seed: 2101,
    trendLabel: "Net sales",
    trendUnit: "EUR",
    secondaryLabel: "Billed",
    breakdownLabel: "Revenue by distribution channel",
    dimensions: ["Direct Sales", "Distributors", "E-Commerce", "Key Accounts", "Retail", "OEM"],
    columns: [
      { key: "document", label: "Sales order" },
      { key: "partner", label: "Sold-to party" },
      { key: "dimension", label: "Channel" },
      { key: "site", label: "Sales org" },
      { key: "quantity", label: "Qty", numeric: true },
      { key: "value", label: "Net value", numeric: true },
      { key: "date", label: "Requested date" },
      { key: "status", label: "Status" },
    ],
    documentPrefix: "SO-",
    statuses: ["Open", "In Delivery", "Billed", "Backorder", "Blocked"],
    kpis: [
      { key: "sd_net_sales", label: "Net Sales", subtitle: "Rolling 12 months", unit: "M EUR", base: 58.4, decimals: 1, kind: "kpi", icon: "currency" },
      { key: "sd_open_orders", label: "Open Sales Orders", subtitle: "Not yet delivered", base: 1_284, kind: "kpi", icon: "cart" },
      { key: "sd_backorders", label: "Backorders", subtitle: "Past requested date", base: 96, kind: "kpi", icon: "alert" },
      { key: "sd_sales_trend", label: "Sales Trend", subtitle: "Monthly net sales", unit: "K EUR", base: 4_870, kind: "chart", icon: "trend" },
    ],
  },
  {
    key: "fi",
    code: "FI",
    title: "Financial Accounting",
    groupKey: "financial-accounting",
    groupTitle: "Financial Accounting",
    description: "Receivables, payables, cash position and closing status.",
    seed: 3307,
    trendLabel: "Cash inflow",
    trendUnit: "EUR",
    secondaryLabel: "Outflow",
    breakdownLabel: "Open receivables by ageing bucket",
    dimensions: ["Not due", "1-30 days", "31-60 days", "61-90 days", "91-180 days", "> 180 days"],
    columns: [
      { key: "document", label: "Document" },
      { key: "partner", label: "Business partner" },
      { key: "dimension", label: "Ageing" },
      { key: "site", label: "Company code" },
      { key: "quantity", label: "Days open", numeric: true },
      { key: "value", label: "Amount", numeric: true },
      { key: "date", label: "Due date" },
      { key: "status", label: "Status" },
    ],
    documentPrefix: "FI-",
    statuses: ["Open", "Partially Paid", "Cleared", "Overdue", "Disputed"],
    kpis: [
      { key: "fi_receivables", label: "Open Receivables", subtitle: "All company codes", unit: "M EUR", base: 12.7, decimals: 1, kind: "kpi", icon: "currency" },
      { key: "fi_payables", label: "Open Payables", subtitle: "Due within 30 days", unit: "M EUR", base: 8.3, decimals: 1, kind: "kpi", icon: "doc" },
      { key: "fi_dso", label: "Days Sales Outstanding", subtitle: "Rolling average", unit: "days", base: 42, kind: "kpi", icon: "clock" },
      { key: "fi_cash_trend", label: "Cash Flow Trend", subtitle: "Monthly net cash", unit: "K EUR", base: 2_140, kind: "chart", icon: "trend" },
    ],
  },
  {
    key: "pp",
    code: "PP",
    title: "Production Planning",
    groupKey: "production-planning",
    groupTitle: "Production Planning",
    description: "Production orders, capacity load, schedule adherence and shortages.",
    seed: 5501,
    trendLabel: "Output",
    trendUnit: "units",
    secondaryLabel: "Planned",
    breakdownLabel: "Production volume by plant",
    dimensions: ["1010 Hamburg", "1710 Chicago", "2210 Lyon", "3310 Osaka", "4410 Pune", "5510 Monterrey"],
    columns: [
      { key: "document", label: "Production order" },
      { key: "partner", label: "Material" },
      { key: "dimension", label: "Plant" },
      { key: "site", label: "Work centre" },
      { key: "quantity", label: "Qty", numeric: true },
      { key: "value", label: "Order cost", numeric: true },
      { key: "date", label: "Finish date" },
      { key: "status", label: "Status" },
    ],
    documentPrefix: "PO-",
    statuses: ["Created", "Released", "In Progress", "Confirmed", "Delayed"],
    kpis: [
      { key: "pp_open_orders", label: "Open Production Orders", subtitle: "Released and in progress", base: 412, kind: "kpi", icon: "list" },
      { key: "pp_schedule_adherence", label: "Schedule Adherence", subtitle: "Last 30 days", unit: "%", base: 91, kind: "kpi", icon: "check" },
      { key: "pp_capacity_load", label: "Capacity Utilisation", subtitle: "All work centres", unit: "%", base: 84, kind: "kpi", icon: "pie" },
      { key: "pp_output_trend", label: "Output Trend", subtitle: "Monthly confirmed output", unit: "units", base: 62_400, kind: "chart", icon: "trend" },
    ],
  },
];

export const MODULE_KEYS = MODULES.map((m) => m.key);

export function findModule(key: string | undefined): ModuleDef | undefined {
  return MODULES.find((m) => m.key === key);
}
