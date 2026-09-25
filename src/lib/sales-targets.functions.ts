import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SalesRevenueTarget = {
  fiscalYear: string;
  targetAmount: number;
};

export const listSalesRevenueTargets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("sales_revenue_targets")
      .select("fiscal_year, target_amount")
      .order("fiscal_year", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      fiscalYear: row.fiscal_year,
      targetAmount: Number(row.target_amount),
    }));
  });

export const saveSalesRevenueTarget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: SalesRevenueTarget) => {
    if (!/^\d{4}$/.test(data.fiscalYear)) throw new Error("Choose a valid fiscal year");
    if (!Number.isFinite(data.targetAmount) || data.targetAmount <= 0) {
      throw new Error("Target amount must be greater than zero");
    }
    return data;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("is_super_admin", {
      _user_id: context.userId,
    });
    if (roleError || !isAdmin) throw new Error("Forbidden: Sharvi Admin role required");
    const { error } = await context.supabase.from("sales_revenue_targets").upsert({
      fiscal_year: data.fiscalYear,
      target_amount: data.targetAmount,
      updated_by: context.userId,
    });
    if (error) throw error;
    return { ok: true };
  });

export const removeSalesRevenueTarget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { fiscalYear: string }) => {
    if (!/^\d{4}$/.test(data.fiscalYear)) throw new Error("Choose a valid fiscal year");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("is_super_admin", {
      _user_id: context.userId,
    });
    if (roleError || !isAdmin) throw new Error("Forbidden: Sharvi Admin role required");
    const { error } = await context.supabase
      .from("sales_revenue_targets")
      .delete()
      .eq("fiscal_year", data.fiscalYear);
    if (error) throw error;
    return { ok: true };
  });