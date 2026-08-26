/**
 * SAP application modules beyond MM procurement.
 * Client-safe metadata: shared by the launchpad tiles, the module report
 * route and the mock/OData provider so all three stay in sync.
 */

export type ModuleRole = "admin" | "buyer" | "approver" | "viewer";

export type ModuleKey = "sd" | "fi" | "co" | "pp" | "qm" | "ps";

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
    title: "Sales & Distribution",
    groupKey: "sales-distribution",
    groupTitle: "Sales & Distribution",
    description: "Sales order intake, billing, backorders and delivery performance.",
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
    key: "co",
    code: "CO",
    title: "Controlling",
    groupKey: "controlling",
    groupTitle: "Controlling",
    description: "Cost centre budgets, plan/actual variance and internal orders.",
    seed: 4409,
    trendLabel: "Actual cost",
    trendUnit: "EUR",
    secondaryLabel: "Plan",
    breakdownLabel: "Actual cost by cost centre group",
    dimensions: ["Production", "Logistics", "Quality", "R&D", "Sales & Marketing", "Administration"],
    columns: [
      { key: "document", label: "Cost object" },
      { key: "partner", label: "Responsible" },
      { key: "dimension", label: "Cost centre group" },
      { key: "site", label: "Controlling area" },
      { key: "quantity", label: "Variance %", numeric: true },
      { key: "value", label: "Actual", numeric: true },
      { key: "date", label: "Period end" },
      { key: "status", label: "Status" },
    ],
    documentPrefix: "CC-",
    statuses: ["On Budget", "Watch", "Over Budget", "Under Budget", "Closed"],
    kpis: [
      { key: "co_actual_cost", label: "Actual Cost", subtitle: "Year to date", unit: "M EUR", base: 34.6, decimals: 1, kind: "kpi", icon: "currency" },
      { key: "co_budget_variance", label: "Budget Variance", subtitle: "Plan vs actual", unit: "%", base: 4.2, decimals: 1, kind: "kpi", icon: "alert" },
      { key: "co_internal_orders", label: "Open Internal Orders", subtitle: "Awaiting settlement", base: 74, kind: "kpi", icon: "list" },
      { key: "co_cost_trend", label: "Cost Trend", subtitle: "Monthly actual cost", unit: "K EUR", base: 2_880, kind: "chart", icon: "trend" },
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
  {
    key: "qm",
    code: "QM",
    title: "Quality Management",
    groupKey: "quality-management",
    groupTitle: "Quality Management",
    description: "Inspection lots, defect rates, notifications and supplier quality.",
    seed: 6607,
    trendLabel: "Defect rate",
    trendUnit: "ppm",
    secondaryLabel: "Target",
    breakdownLabel: "Notifications by defect type",
    dimensions: ["Dimensional", "Surface", "Material", "Assembly", "Packaging", "Documentation"],
    columns: [
      { key: "document", label: "Inspection lot" },
      { key: "partner", label: "Material / supplier" },
      { key: "dimension", label: "Defect type" },
      { key: "site", label: "Plant" },
      { key: "quantity", label: "Defects", numeric: true },
      { key: "value", label: "Cost of poor quality", numeric: true },
      { key: "date", label: "Inspection date" },
      { key: "status", label: "Status" },
    ],
    documentPrefix: "QL-",
    statuses: ["Created", "In Inspection", "Accepted", "Rejected", "Rework"],
    kpis: [
      { key: "qm_open_lots", label: "Open Inspection Lots", subtitle: "Awaiting usage decision", base: 187, kind: "kpi", icon: "doc" },
      { key: "qm_defect_rate", label: "Defect Rate", subtitle: "Parts per million", unit: "ppm", base: 640, kind: "kpi", icon: "alert" },
      { key: "qm_notifications", label: "Open Notifications", subtitle: "Quality issues", base: 54, kind: "kpi", icon: "star" },
      { key: "qm_quality_trend", label: "Quality Trend", subtitle: "Monthly defect rate", unit: "ppm", base: 640, kind: "chart", icon: "trend" },
    ],
  },
  {
    key: "ps",
    code: "PS",
    title: "Project Systems",
    groupKey: "project-systems",
    groupTitle: "Project Systems",
    description: "Project budgets, milestone status, WBS spend and delivery risk.",
    seed: 7703,
    trendLabel: "Project spend",
    trendUnit: "EUR",
    secondaryLabel: "Budget",
    breakdownLabel: "Committed spend by project type",
    dimensions: ["Capex", "Product Development", "IT Rollout", "Plant Expansion", "Compliance", "Customer Project"],
    columns: [
      { key: "document", label: "WBS element" },
      { key: "partner", label: "Project manager" },
      { key: "dimension", label: "Project type" },
      { key: "site", label: "Company code" },
      { key: "quantity", label: "Progress %", numeric: true },
      { key: "value", label: "Committed", numeric: true },
      { key: "date", label: "Milestone date" },
      { key: "status", label: "Status" },
    ],
    documentPrefix: "WBS-",
    statuses: ["Planned", "Released", "On Track", "At Risk", "Completed"],
    kpis: [
      { key: "ps_active_projects", label: "Active Projects", subtitle: "Released and running", base: 63, kind: "kpi", icon: "grid" },
      { key: "ps_budget_consumed", label: "Budget Consumed", subtitle: "Across all projects", unit: "%", base: 68, kind: "kpi", icon: "pie" },
      { key: "ps_milestones_at_risk", label: "Milestones At Risk", subtitle: "Next 60 days", base: 17, kind: "kpi", icon: "alert" },
      { key: "ps_spend_trend", label: "Project Spend Trend", subtitle: "Monthly committed spend", unit: "K EUR", base: 1_640, kind: "chart", icon: "trend" },
    ],
  },
];

export const MODULE_KEYS = MODULES.map((m) => m.key);

export function findModule(key: string | undefined): ModuleDef | undefined {
  return MODULES.find((m) => m.key === key);
}
