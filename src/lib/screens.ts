/**
 * Registry of every screen/module that can be granted to a role.
 * Shared by the navigation bar, the launchpad, route guards and the
 * Screen Permissions matrix so all four stay in sync.
 */
import { MODULES } from "./sap-modules";
import { SD_REPORTS } from "./sd-reports";

export type ScreenGroup =
  | "Home"
  | "Reports"
  | "Sales Distribution Reports"
  | "SAP modules"
  | "Administration";

export type ScreenDef = {
  key: string;
  label: string;
  group: ScreenGroup;
};

export const SUPER_ADMIN_ROLE_KEY = "super_admin";

export const SCREENS: ScreenDef[] = [
  { key: "launchpad", label: "Launchpad (Home)", group: "Home" },
  { key: "reports.procurement", label: "Procurement Overview", group: "Reports" },
  { key: "reports.purchase-orders", label: "Purchase Orders", group: "Reports" },
  { key: "reports.suppliers", label: "Suppliers", group: "Reports" },
  { key: "reports.sales-analytics", label: "Sales Analytics", group: "Reports" },
  ...SD_REPORTS.map((report) => ({
    key: report.screen,
    label: `${report.title} (${report.tcode})`,
    group: "Sales Distribution Reports" as const,
  })),
  ...MODULES.map((mod) => ({
    key: `module.${mod.key}`,
    label: `${mod.code} — ${mod.title}`,
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
  "Administration",
];

export function screenLabel(key: string): string {
  return SCREENS.find((screen) => screen.key === key)?.label ?? key;
}

export function hasScreen(screens: readonly string[] | undefined, key: string): boolean {
  return (screens ?? []).includes(key);
}
