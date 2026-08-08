import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

export const getLaunchpad = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LaunchpadData> => {
    const { supabase, userId } = context;
    const provider = await import("./sap-provider.server");

    const [rolesRes, profileRes, groupsRes, tilesRes, kpis] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("profiles").select("display_name, company, avatar_url").eq("id", userId).maybeSingle(),
      supabase.from("tile_groups").select("key, title, sort_order").order("sort_order"),
      supabase.from("tiles").select("*").order("sort_order"),
      provider.getKpiValues(),
    ]);

    const roles = (rolesRes.data ?? []).map((r) => r.role as AppRole);
    const tiles = ((tilesRes.data ?? []) as TileRecord[]).filter((tile) =>
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
  });

export const getProcurementOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const provider = await import("./sap-provider.server");
    const [trend, categories, suppliers] = await Promise.all([
      provider.getSpendTrend(),
      provider.getCategorySpend(),
      provider.getTopSuppliers(8),
    ]);
    return { trend, categories, suppliers, providerMode: provider.providerMode() };
  });

export const getPurchaseOrderReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const provider = await import("./sap-provider.server");
    const items = await provider.getPurchaseOrderItems();
    return { items, providerMode: provider.providerMode() };
  });

export const getSupplierReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const provider = await import("./sap-provider.server");
    const suppliers = await provider.getSupplierScorecards();
    return { suppliers, providerMode: provider.providerMode() };
  });

export const getModuleReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { module: string }) => input)
  .handler(async ({ data }) => {
    const provider = await import("./sap-provider.server");
    const report = await provider.getModuleReportData(data.module);
    return { report, providerMode: provider.providerMode() };
  });
