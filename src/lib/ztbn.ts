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

export type ZtbnProfitCentre = {
  key: string;
  label: string;
  debitField: string;
  creditField: string;
};

export type ZtbnGlSummary = {
  id: string;
  sourceRowNo: number;
  glCode: string;
  description: string;
  debit: number;
  credit: number;
  net: number;
  cumulativeBalance: number;
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

export async function listAllZtbnRows(): Promise<ZtbnRow[]> {
  const pageSize = 1000;
  const rows: ZtbnRow[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("ztbn")
      .select("*")
      .order("source_row_no")
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const batch = (data ?? []) as unknown as ZtbnRow[];
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }
  return rows;
}

function numeric(value: string | number | null | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function profitCentresFromColumns(columns: ZtbnColumn[]): ZtbnProfitCentre[] {
  const credits = new Map(columns.filter((column) => column.field_name.endsWith("_credit")).map((column) => [column.field_name.slice(0, -7), column]));
  return columns
    .filter((column) => column.field_name.endsWith("_debit"))
    .flatMap((debitColumn) => {
      const key = debitColumn.field_name.slice(0, -6);
      const creditColumn = credits.get(key);
      if (!creditColumn) return [];
      const label = debitColumn.ui_label.replace(/\s*\(Debit\).*$/i, "").replace(/\(De$/i, "");
      return [{ key, label, debitField: debitColumn.field_name, creditField: creditColumn.field_name }];
    });
}

export function aggregateZtbn(rows: ZtbnRow[], profitCentres: ZtbnProfitCentre[], selectedPc = "all", search = "") {
  const term = search.trim().toLowerCase();
  const detailRows = rows.filter((row) => String(row.gl_code ?? "").trim() !== "");
  const filteredRows = detailRows.filter((row) => !term || `${row.gl_code ?? ""} ${row.gl_description ?? ""}`.toLowerCase().includes(term));
  const activeCentres = selectedPc === "all" ? profitCentres : profitCentres.filter((centre) => centre.key === selectedPc);
  const glRows: ZtbnGlSummary[] = filteredRows.map((row) => {
    const debit = activeCentres.reduce((sum, centre) => sum + numeric(row[centre.debitField]), 0);
    const credit = activeCentres.reduce((sum, centre) => sum + numeric(row[centre.creditField]), 0);
    return {
      id: row.id,
      sourceRowNo: row.source_row_no,
      glCode: String(row.gl_code ?? ""),
      description: String(row.gl_description ?? "—"),
      debit,
      credit,
      net: debit - credit,
      cumulativeBalance: numeric(row.cumm_balance),
    };
  });
  const centres = activeCentres.map((centre) => {
    const debit = filteredRows.reduce((sum, row) => sum + numeric(row[centre.debitField]), 0);
    const credit = filteredRows.reduce((sum, row) => sum + numeric(row[centre.creditField]), 0);
    return { ...centre, debit, credit, net: debit - credit };
  });
  const totalDebit = glRows.reduce((sum, row) => sum + row.debit, 0);
  const totalCredit = glRows.reduce((sum, row) => sum + row.credit, 0);
  return {
    glRows,
    centres,
    totalDebit,
    totalCredit,
    netBalance: totalDebit - totalCredit,
    cumulativeBalance: glRows.reduce((sum, row) => sum + row.cumulativeBalance, 0),
    accountCount: glRows.length,
  };
}