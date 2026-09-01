import { supabase } from "@/integrations/supabase/client";
import { canAccessModule, MODULES } from "./sap-modules";
import { accessForUser } from "./access";
import { groupScreenKey } from "./screens";

import * as provider from "./sap-provider";

export type AppRole = "admin" | "buyer" | "approver" | "viewer";

export type TileRecord = {
  id: string;
  group_key: string;
  title: string;
  subtitle: string | null;
  icon: string;
  kind: string;
  kpi_key: string | null;
  target_path: string | null;
  allowed_roles: AppRole[];
  sort_order: number;
};

export type LaunchpadData = {
  roles: string[];
  isSuperAdmin: boolean;
  screens: string[];
  profile: { display_name: string | null; company: string | null; avatar_url: string | null } | null;
  groups: { key: string; title: string; sort_order: number }[];
  tiles: TileRecord[];
  kpis: Record<string, { value: number; unit?: string; footer?: string; trend?: number[] }>;
  providerMode: "mock" | "odata";
};

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("NOT_AUTHENTICATED");
  return data.user.id;
}

async function screensForUser(userId: string): Promise<string[]> {
  return (await accessForUser(userId)).screens;
}

/** Tile group -> screen key. Every group is gated by Screen Permissions. */
const GROUP_SCREEN: Record<string, string> = Object.fromEntries(
  MODULES.map((mod) => [mod.groupKey, `module.${mod.key}`]),
);

function screenForGroup(groupKey: string): string {
  return GROUP_SCREEN[groupKey] ?? groupScreenKey(groupKey);
}

export async function getLaunchpad(): Promise<LaunchpadData> {
  const userId = await requireUserId();

  const [access, profileRes, groupsRes, tilesRes, kpis] = await Promise.all([
    accessForUser(userId),
    supabase.from("profiles").select("display_name, company, avatar_url").eq("id", userId).maybeSingle(),
    supabase.from("tile_groups").select("key, title, sort_order").order("sort_order"),
    supabase.from("tiles").select("*").order("sort_order"),
    provider.getKpiValues(),
  ]);

  const { roleKeys, isSuperAdmin, screens } = access;
  const tiles = ((tilesRes.data ?? []) as unknown as TileRecord[]).filter((tile) => {
    if (isSuperAdmin) return true;
    return screens.includes(screenForGroup(tile.group_key));
  });


  return {
    roles: roleKeys,
    isSuperAdmin,
    screens,
    profile: profileRes.data ?? null,
    groups: groupsRes.data ?? [],
    tiles,
    kpis,
    providerMode: provider.providerMode(),
  };
}

/** Screen permission required for each report dataset. */
const REPORT_SCREENS = {
  procurement: "reports.procurement",
  purchaseOrders: "reports.purchase-orders",
  suppliers: "reports.suppliers",
} as const;

async function assertReportAccess(report: keyof typeof REPORT_SCREENS) {
  const screens = await screensForUser(await requireUserId());
  if (!screens.includes(REPORT_SCREENS[report])) throw new Error("FORBIDDEN_REPORT");
}

export async function getProcurementOverview() {
  await assertReportAccess("procurement");
  const [trend, categories, suppliers] = await Promise.all([
    provider.getSpendTrend(),
    provider.getCategorySpend(),
    provider.getTopSuppliers(8),
  ]);
  return { trend, categories, suppliers, providerMode: provider.providerMode() };
}

export async function getPurchaseOrderReport() {
  await assertReportAccess("purchaseOrders");
  const items = await provider.getPurchaseOrderItems();
  return { items, providerMode: provider.providerMode() };
}

export async function getSupplierReport() {
  await assertReportAccess("suppliers");
  const suppliers = await provider.getSupplierScorecards();
  return { suppliers, providerMode: provider.providerMode() };
}

export async function getModuleReport(input: { data: { module: string } }) {
  const roles = await screensForUser(await requireUserId());
  if (!canAccessModule(input.data.module, roles)) {
    throw new Error("FORBIDDEN_MODULE");
  }
  const report = await provider.getModuleReportData(input.data.module);
  return { report, providerMode: provider.providerMode() };
}
