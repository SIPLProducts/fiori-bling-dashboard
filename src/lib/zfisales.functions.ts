import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { canAccessModule } from "./sap-modules";
import type { SalesFilters, SalesAnalytics } from "./zfisales-types";

async function rolesForUser(
  supabase: { from: (table: "user_roles") => { select: (c: "role") => unknown } },
  userId: string,
): Promise<string[]> {
  const query = supabase.from("user_roles").select("role") as {
    eq: (column: string, value: string) => PromiseLike<{ data: { role: string }[] | null }>;
  };
  const { data } = await query.eq("user_id", userId);
  return (data ?? []).map((r) => r.role);
}

const emptyFilters: SalesFilters = {
  fiscalYear: "",
  companyCodes: [],
  profitCentres: [],
  salesTypes: [],
  segments: [],
  postingFrom: "",
  postingTo: "",
  search: "",
};

export const getSalesAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Partial<SalesFilters> | undefined) => ({ ...emptyFilters, ...(input ?? {}) }))
  .handler(async ({ data, context }): Promise<SalesAnalytics> => {
    const roles = await rolesForUser(context.supabase, context.userId);
    if (!canAccessModule("sd", roles)) throw new Error("FORBIDDEN_MODULE");
    const { buildSalesAnalytics } = await import("./zfisales.server");
    return buildSalesAnalytics(data);
  });
