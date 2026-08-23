import { supabase } from "@/integrations/supabase/client";
import { canAccessModule } from "./sap-modules";
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
  roles: AppRole[];
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

async function rolesForUser(userId: string): Promise<AppRole[]> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r) => r.role as AppRole);
}

export async function getLaunchpad(): Promise<LaunchpadData> {
  const userId = await requireUserId();

  const [rolesRes, profileRes, groupsRes, tilesRes, kpis] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase.from("profiles").select("display_name, company, avatar_url").eq("id", userId).maybeSingle(),
    supabase.from("tile_groups").select("key, title, sort_order").order("sort_order"),
    supabase.from("tiles").select("*").order("sort_order"),
    provider.getKpiValues(),
  ]);

  const roles = (rolesRes.data ?? []).map((r) => r.role as AppRole);
  const tiles = ((tilesRes.data ?? []) as unknown as TileRecord[]).filter((tile) =>
    tile.allowed_roles.some((role) => roles.includes(role)),
  );

  return {
    roles,
    profile: profileRes.data ?? null,
    groups: groupsRes.data ?? [],
    tiles,
    kpis,
    providerMode: provider.providerMode(),
  };
}

/** Roles allowed to read each report dataset — mirrors the launchpad tiles. */
const REPORT_ROLES = {
  procurement: ["admin", "buyer", "approver"],
  purchaseOrders: ["admin", "buyer", "approver", "viewer"],
  suppliers: ["admin", "buyer", "viewer"],
} as const satisfies Record<string, readonly AppRole[]>;

async function assertReportAccess(report: keyof typeof REPORT_ROLES) {
  const roles = await rolesForUser(await requireUserId());
  const allowed = REPORT_ROLES[report] as readonly AppRole[];
  if (!roles.some((role) => allowed.includes(role))) throw new Error("FORBIDDEN_REPORT");
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
  const roles = await rolesForUser(await requireUserId());
  if (!canAccessModule(input.data.module, roles)) {
    throw new Error("FORBIDDEN_MODULE");
  }
  const report = await provider.getModuleReportData(input.data.module);
  return { report, providerMode: provider.providerMode() };
}
