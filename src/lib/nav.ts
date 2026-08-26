export type NavPath =
  | "/launchpad"
  | "/reports/procurement"
  | "/reports/purchase-orders"
  | "/reports/suppliers"
  | "/reports/sales-analytics"
  | "/admin/users"
  | "/admin/roles"
  | "/admin/permissions";

export type NavItem = {
  to: NavPath;
  label: string;
  /** Screen permission key required to see this entry. */
  screen: string;
};

export const NAV_ITEMS: NavItem[] = [
  { to: "/launchpad", label: "Home", screen: "launchpad" },
  { to: "/reports/procurement", label: "Procurement", screen: "reports.procurement" },
  { to: "/reports/purchase-orders", label: "Purchase Orders", screen: "reports.purchase-orders" },
  { to: "/reports/suppliers", label: "Suppliers", screen: "reports.suppliers" },
  { to: "/reports/sales-analytics", label: "Sales Analytics", screen: "reports.sales-analytics" },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { to: "/admin/users", label: "User Management", screen: "admin.users" },
  { to: "/admin/roles", label: "Roles", screen: "admin.roles" },
  { to: "/admin/permissions", label: "Screen Permissions", screen: "admin.permissions" },
];

/** Main navigation entries the user's screen permissions allow. */
export function navForScreens(screens: readonly string[] | undefined): NavItem[] {
  const allowed = screens ?? [];
  const items = NAV_ITEMS.filter((item) => allowed.includes(item.screen));
  return items.length ? items : NAV_ITEMS.filter((item) => item.to === "/launchpad");
}

export function adminNavForScreens(screens: readonly string[] | undefined): NavItem[] {
  const allowed = screens ?? [];
  return ADMIN_NAV_ITEMS.filter((item) => allowed.includes(item.screen));
}

/** Route guard for a top-level report/admin screen. */
export function canAccessPath(path: NavPath, screens: readonly string[] | undefined): boolean {
  const item = [...NAV_ITEMS, ...ADMIN_NAV_ITEMS].find((nav) => nav.to === path);
  if (!item) return false;
  return (screens ?? []).includes(item.screen);
}

/** Which tile groups matter most to each role — drives launchpad ordering. */
const ALL_GROUPS = [
  "procurement-overview",
  "purchase-order",
  "purchase-requisition",
  "supplier-evaluation",
  "purchase-contract",
  "workflow",
  "sales-distribution",
  "financial-accounting",
  "controlling",
  "production-planning",
  "quality-management",
  "project-systems",
];

const GROUP_PRIORITY: Record<string, string[]> = {
  super_admin: ALL_GROUPS,
  admin: ALL_GROUPS,
  buyer: ["purchase-order", "purchase-requisition", "supplier-evaluation", "purchase-contract", ...ALL_GROUPS],
  approver: ["workflow", "purchase-requisition", "purchase-order", ...ALL_GROUPS],
  viewer: ALL_GROUPS,
};

const ROLE_RANK = ["super_admin", "admin", "approver", "buyer", "viewer"];

/** Primary role key used for personalising the launchpad layout. */
export function primaryRole(roles: readonly string[] | undefined): string | null {
  if (!roles?.length) return null;
  return ROLE_RANK.find((role) => roles.includes(role)) ?? roles[0] ?? null;
}

export function orderGroupsForRoles<T extends { key: string; sort_order: number }>(
  groups: T[],
  roles: readonly string[] | undefined,
): T[] {
  const role = primaryRole(roles);
  const priority = (role && GROUP_PRIORITY[role]) || [];
  return [...groups].sort((a, b) => {
    const ai = priority.indexOf(a.key);
    const bi = priority.indexOf(b.key);
    const ar = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
    const br = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
    return ar - br || a.sort_order - b.sort_order;
  });
}

export const ROLE_HEADLINE: Record<string, string> = {
  super_admin: "Sharvi Admin — full access to every screen, module, user, role and permission.",
  admin: "Admin view — the screens granted to your role.",
  buyer: "Buyer view — purchase orders, requisitions, suppliers and contracts first.",
  approver: "Approver view — workflow and pending approvals first.",
  viewer: "Read-only view — spend overview and published reports.",
};
