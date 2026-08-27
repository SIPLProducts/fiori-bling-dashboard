import { supabase } from "@/integrations/supabase/client";
import { accessForUser } from "./access";
import { canAccessSdReport } from "./sd-reports";
import { buildSdKpi, type SdKpiFilters, type SdKpiResult } from "./sd-kpi";

const EMPTY: SdKpiFilters = {
  postingFrom: "",
  postingTo: "",
  profitCentres: [],
  plants: [],
};

export async function getSdSalesKpi(input?: {
  data?: Partial<SdKpiFilters>;
}): Promise<SdKpiResult> {
  const { data: auth, error } = await supabase.auth.getUser();
  if (error || !auth.user) throw new Error("NOT_AUTHENTICATED");

  const { screens } = await accessForUser(auth.user.id);
  if (!canAccessSdReport("kpi", screens)) throw new Error("FORBIDDEN_SCREEN");

  return buildSdKpi({ ...EMPTY, ...(input?.data ?? {}) });
}
