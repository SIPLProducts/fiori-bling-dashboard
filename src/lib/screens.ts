/**
 * Registry of every screen/module that can be granted to a role.
 * Shared by the navigation bar, the launchpad, route guards and the
 * Screen Permissions matrix so all four stay in sync.
 */
import { SD_REPORTS } from "./sd-reports";

export type ScreenGroup =
  | "Home"
  | "Reports"
  | "Sales Distribution Reports"
  | "SAP modules"
  | "Tables Master"
  | "Administration";

export type ScreenDef = {
  key: string;
  label: string;
  group: ScreenGroup;
};

export type PermissionChild = { key: string; label: string; tileKey?: string };
export type PermissionModule = {
  key: string;
  label: string;
  groupKey: string;
  children: PermissionChild[];
};

export const TABLES_MASTER_GROUP_KEY = "tables-master";

/** Screen key that gates a launchpad tile group. */
export function groupScreenKey(groupKey: string): string {
  return `group.${groupKey}`;
}


export const SUPER_ADMIN_ROLE_KEY = "super_admin";

/** Module hierarchy shared by permissions, launchpad filtering, and route guards. */
export const PERMISSION_MODULES: PermissionModule[] = [
  {
    key: "module.sd",
    label: "Sales & Distribution",
    groupKey: "sales-distribution",
    children: [
      { key: "sd.total-sales", label: "Total Sales", tileKey: "sd_total_sales" },
      { key: "sd.open-sales-orders", label: "Open Sales Orders", tileKey: "sd_open_orders" },
    ],
  },
  {
    key: "module.fi",
    label: "Financial Accounting",
    groupKey: "financial-accounting",
    children: [
      { key: "fi.open-receivables", label: "Open Receivables", tileKey: "fi_receivables" },
      { key: "fi.open-payables", label: "Open Payables", tileKey: "fi_payables" },
      { key: "fi.days-sales-outstanding", label: "Days Sales Outstanding", tileKey: "fi_dso" },
      { key: "fi.cash-flow-trend", label: "Cash Flow Trend", tileKey: "fi_cash_trend" },
    ],
  },
  {
    key: "module.pp",
    label: "Production Planning",
    groupKey: "production-planning",
    children: [
      { key: "pp.open-production-orders", label: "Open Production Orders", tileKey: "pp_open_orders" },
      { key: "pp.schedule-adherence", label: "Schedule Adherence", tileKey: "pp_schedule_adherence" },
      { key: "pp.capacity-utilisation", label: "Capacity Utilisation", tileKey: "pp_capacity_load" },
      { key: "pp.output-trend", label: "Output Trend", tileKey: "pp_output_trend" },
    ],
  },
  {
    key: groupScreenKey(TABLES_MASTER_GROUP_KEY),
    label: "Tables Master",
    groupKey: TABLES_MASTER_GROUP_KEY,
    children: [
      { key: "tables.zfisales-detail", label: "ZFISALES Detail", tileKey: "table_zfisales_detail" },
    ],
  },
];

export const MODULE_CHILD_SCREENS = PERMISSION_MODULES.flatMap((module) => module.children);

export function permissionModule(moduleKey: string): PermissionModule | undefined {
  return PERMISSION_MODULES.find((module) => module.key === `module.${moduleKey}`);
}

export function childScreenForTile(tile: {
  group_key: string;
  kpi_key: string | null;
  screen_key?: string | null;
}): string | null {
  if (tile.screen_key) return tile.screen_key;
  const module = PERMISSION_MODULES.find((item) => item.groupKey === tile.group_key);
  if (!module) return null;
  if (tile.group_key === "sales-distribution" && !tile.kpi_key) return "sd.total-sales";
  return module.children.find((child) => child.tileKey === tile.kpi_key)?.key ?? null;
}

export function hasAnyModuleChild(
  screens: readonly string[] | undefined,
  moduleKey: string,
): boolean {
  const module = permissionModule(moduleKey);
  if (!module) return false;
  return module.children.some((child) => hasScreen(screens, child.key));
}

export const SCREENS: ScreenDef[] = [
  { key: "launchpad", label: "Launchpad (Home)", group: "Home" },
  { key: "reports.sales-analytics", label: "Sales Analytics", group: "Reports" },
  ...SD_REPORTS.map((report) => ({
    key: report.screen,
    label: report.title,
    group: "Sales Distribution Reports" as const,
  })),
  ...MODULE_CHILD_SCREENS.map((screen) => ({
    key: screen.key,
    label: screen.label,
    group: "SAP modules" as const,
  })),
  { key: "admin.users", label: "User Management", group: "Administration" },
  { key: "admin.roles", label: "Roles", group: "Administration" },
  { key: "admin.permissions", label: "Screen Permissions", group: "Administration" },
  { key: "admin.sap-api", label: "SAP API Settings", group: "Administration" },
];

export const SCREEN_GROUPS: ScreenGroup[] = [
  "Home",
  "Reports",
  "Sales Distribution Reports",
  "SAP modules",
  "Tables Master",
  "Administration",
];


export function screenLabel(key: string): string {
  return SCREENS.find((screen) => screen.key === key)?.label ?? key;
}

export function hasScreen(screens: readonly string[] | undefined, key: string): boolean {
  return (screens ?? []).includes(key);
}
