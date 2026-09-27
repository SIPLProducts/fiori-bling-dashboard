import { supabase } from "@/integrations/supabase/client";

export type ZtbnRow = Record<string, string | number | null> & {
  id: string;
  source_row_no: number;
  gl_code: string | null;
  gl_description: string | null;
};

export type ZtbnColumn = {
  field_name: string;
  ui_label: string;
  data_type: string;
  sort_order: number;
};

export async function listZtbnColumns(): Promise<ZtbnColumn[]> {
  const { data, error } = await supabase
    .from("sap_table_fields")
    .select("field_name, ui_label, data_type, sort_order")
    .eq("table_key", "ztbn")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as ZtbnColumn[];
}

export async function listZtbnRows(input: {
  page: number;
  pageSize: number;
  search: string;
}): Promise<{ rows: ZtbnRow[]; count: number }> {
  const from = (input.page - 1) * input.pageSize;
  let query = supabase
    .from("ztbn")
    .select("*", { count: "exact" })
    .order("source_row_no")
    .range(from, from + input.pageSize - 1);

  const term = input.search.trim().replace(/[,%()]/g, " ");
  if (term) {
    query = query.or(`gl_code.ilike.%${term}%,gl_description.ilike.%${term}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: (data ?? []) as unknown as ZtbnRow[], count: count ?? 0 };
}