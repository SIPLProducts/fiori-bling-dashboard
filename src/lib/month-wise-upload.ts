import { supabase } from "@/integrations/supabase/client";

export const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
/** April–March order for the dropdown. */
export const FY_MONTH_ORDER = [4,5,6,7,8,9,10,11,12,1,2,3];
export const BASE_COLUMNS = ["Plnt","Location","Material","Material Description","Profit Centre","SAC/HSN Code","MTyp","ValCl","Val. Type","BUn","OB Qty","OB Val","RCPT Qty","RCPT Val","ISS Qty","ISS Val","CB Qty","CB Val","G/L Acct","Gl Description","Price","Std price","Pr.","Matl Group"];
export const EXTRA_COLUMNS = ["Month","Year","Created Date","Updated Date"];

export type MwuRow = { id: string; month: number; year: number; data: Record<string, string>; created_at: string; updated_at: string };

/** Pure: known columns first in file order, then any other uploaded columns. */
export function orderColumns(rows: { data: Record<string, string> }[]): string[] {
  const seen = new Set<string>();
  rows.forEach((r) => Object.keys(r.data).forEach((k) => seen.add(k)));
  const base = BASE_COLUMNS.filter((c) => seen.has(c));
  return [...base, ...[...seen].filter((c) => !BASE_COLUMNS.includes(c))];
}

/** Pure: drop rows where every cell is empty. */
export const nonEmptyRows = (rows: Record<string, string>[]) => rows.filter((r) => Object.values(r).some((v) => (v ?? "").toString().trim() !== ""));

export async function fetchMonthRows(month: number, year: number): Promise<MwuRow[]> {
  const out: MwuRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("month_wise_upload").select("id,month,year,data,created_at,updated_at").eq("month", month).eq("year", year).order("created_at").order("id").range(from, from + 999);
    if (error) throw error;
    out.push(...((data ?? []) as unknown as MwuRow[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

/** Replace a month's rows, keeping its original created date. */
export async function replaceMonth(month: number, year: number, rows: Record<string, string>[], existingCreated: string | null, onProgress?: (d: number, t: number) => void) {
  const { data: u } = await supabase.auth.getUser();
  const del = await supabase.from("month_wise_upload").delete().eq("month", month).eq("year", year);
  if (del.error) throw del.error;
  const now = new Date().toISOString();
  const created = existingCreated ?? now;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500).map((d) => ({ month, year, data: d, created_at: created, updated_at: now, created_by: u.user?.id ?? null }));
    const { error } = await supabase.from("month_wise_upload").insert(chunk);
    if (error) throw error;
    onProgress?.(Math.min(i + 500, rows.length), rows.length);
  }
}

export async function updateRow(id: string, data: Record<string, string>) {
  const { error } = await supabase.from("month_wise_upload").update({ data, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}
export async function deleteRows(ids: string[], month: number, year: number) {
  const { error } = await supabase.from("month_wise_upload").delete().in("id", ids);
  if (error) throw error;
  await supabase.from("month_wise_upload").update({ updated_at: new Date().toISOString() }).eq("month", month).eq("year", year);
}
