import { supabase } from "@/integrations/supabase/client";
import { canAccessModule } from "./sap-modules";
import { accessForUser } from "./access";
import { buildSalesAnalytics } from "./zfisales";
import type { SalesFilters, SalesAnalytics } from "./zfisales-types";

const emptyFilters: SalesFilters = {
  fiscalYear: "",
  companyCodes: [],
  profitCentres: [],
  salesTypes: [],
  segments: [],
  postingFrom: "",
  postingTo: "",
  search: "",
  seriesBy: "none",
};

export async function getSalesAnalytics(input?: {
  data?: Partial<SalesFilters>;
}): Promise<SalesAnalytics> {
  const { data: auth, error } = await supabase.auth.getUser();
  if (error || !auth.user) throw new Error("NOT_AUTHENTICATED");

  const { screens } = await accessForUser(auth.user.id);
  if (!canAccessModule("sd", screens)) throw new Error("FORBIDDEN_MODULE");

  return buildSalesAnalytics({ ...emptyFilters, ...(input?.data ?? {}) });
}
