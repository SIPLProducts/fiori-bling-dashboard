import type { AppRole } from "./sap.functions";

export type NavPath =
  | "/launchpad"
  | "/reports/procurement"
  | "/reports/purchase-orders"
  | "/reports/suppliers"
  | "/admin/users";

export type NavItem = {
  to: NavPath;
  label: string;
  roles: AppRole[];
};

export const NAV_ITEMS: NavItem[] = [
  { to: "/launchpad", label: "Home", roles: ["admin", "buyer", "approver", "viewer"] },
  { to: "/reports/procurement", label: "Procurement", roles: ["admin", "buyer", "approver"] },
  { to: "/reports/purchase-orders", label: "Purchase Orders", roles: ["admin", "buyer", "approver", "viewer"] },
  { to: "/reports/suppliers", label: "Suppliers", roles: ["admin", "buyer", "approver", "viewer"] },
  { to: "/admin/users", label: "Users & Roles", roles: ["admin"] },
];

export function navForRoles(roles: readonly string[] | undefined): NavItem[] {
  if (!roles?.length) return NAV_ITEMS.filter((item) => item.to === "/launchpad");
  return NAV_ITEMS.filter((item) => item.roles.some((role) => roles.includes(role)));
}

/** Which tile groups matter most to each role — drives launchpad ordering. */
const GROUP_PRIORITY: Record<AppRole, string[]> = {
  admin: ["procurement-overview", "purchase-order", "purchase-requisition", "supplier-evaluation", "purchase-contract", "workflow", "sales-distribution", "financial-accounting", "controlling", "production-planning", "quality-management", "project-systems"],
  buyer: ["purchase-order", "purchase-requisition", "supplier-evaluation", "purchase-contract", "procurement-overview", "workflow", "sales-distribution", "financial-accounting", "controlling", "production-planning", "quality-management", "project-systems"],
  approver: ["workflow", "purchase-requisition", "purchase-order", "procurement-overview", "supplier-evaluation", "purchase-contract"],
  viewer: ["procurement-overview", "purchase-order", "supplier-evaluation", "purchase-requisition", "purchase-contract", "workflow", "sales-distribution", "financial-accounting", "controlling", "production-planning", "quality-management", "project-systems"],
};

const ROLE_RANK: AppRole[] = ["approver", "buyer", "admin", "viewer"];

/** Primary role used for personalising the launchpad layout. */
export function primaryRole(roles: readonly string[] | undefined): AppRole | null {
  if (!roles?.length) return null;
  const match = ROLE_RANK.find((role) => roles.includes(role));
  return match ?? null;
}

export function orderGroupsForRoles<T extends { key: string; sort_order: number }>(
  groups: T[],
  roles: readonly string[] | undefined,
): T[] {
  const role = primaryRole(roles);
  const priority = role ? GROUP_PRIORITY[role] : [];
  return [...groups].sort((a, b) => {
    const ai = priority.indexOf(a.key);
    const bi = priority.indexOf(b.key);
    const ar = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
    const br = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
    return ar - br || a.sort_order - b.sort_order;
  });
}

export const ROLE_HEADLINE: Record<AppRole, string> = {
  admin: "Full portfolio view — every group, KPI and administration tool.",
  buyer: "Buyer view — purchase orders, requisitions, suppliers and contracts first.",
  approver: "Approver view — workflow and pending approvals first.",
  viewer: "Read-only view — spend overview and published reports.",
};
