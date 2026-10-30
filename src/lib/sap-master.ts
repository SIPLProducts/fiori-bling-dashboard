import { supabase } from "@/integrations/supabase/client";
import { datedFileName } from "@/lib/format";

export type SapMaster = { id: string; name: string; columns: string[]; key_column: string; row_count: number; last_uploaded_at: string };
export type ParsedSheet = { name: string; columns: string[]; rows: Record<string, string>[] };
export type MasterRow = { k: string; d: Record<string, string> };

const cellText = (v: unknown): string => {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    const o = v as { text?: unknown; result?: unknown; richText?: { text: string }[] };
    if (o.richText) return o.richText.map((t) => t.text).join("");
    if (o.result != null) return cellText(o.result);
    if (o.text != null) return String(o.text);
  }
  return String(v).trim();
};

/** Pure: grid (first row = headers) → named columns and row objects; blank rows dropped. */
export function gridToSheet(name: string, grid: unknown[][]): ParsedSheet {
  const header = (grid[0] ?? []).map(cellText);
  const columns: string[] = [];
  const idx: number[] = [];
  header.forEach((h, i) => { if (h && !columns.includes(h)) { columns.push(h); idx.push(i); } });
  const rows = grid.slice(1).map((r) => {
    const o: Record<string, string> = {};
    columns.forEach((c, j) => { o[c] = cellText(r?.[idx[j]!]); });
    return o;
  }).filter((o) => Object.values(o).some((v) => v !== ""));
  return { name: name.trim(), columns, rows };
}

/** Pure: rows keyed by key column; rows without key dropped; later duplicates win (merged). */
export function keyRows(rows: Record<string, string>[], keyColumn: string): MasterRow[] {
  const map = new Map<string, Record<string, string>>();
  for (const r of rows) {
    const k = (r[keyColumn] ?? "").trim();
    if (!k) continue;
    map.set(k, { ...(map.get(k) ?? {}), ...r });
  }
  return [...map].map(([k, d]) => ({ k, d }));
}

/** Pure: same rule the database applies — new keys added, matching keys merged, new columns appended. */
export function mergeMaster(existing: { columns: string[]; rows: MasterRow[] }, incoming: { columns: string[]; rows: MasterRow[] }) {
  const map = new Map(existing.rows.map((r) => [r.k, r.d]));
  for (const r of incoming.rows) map.set(r.k, { ...(map.get(r.k) ?? {}), ...r.d });
  const columns = [...existing.columns, ...incoming.columns.filter((c) => !existing.columns.includes(c))];
  return { columns, rows: [...map].map(([k, d]) => ({ k, d })) };
}

export async function parseWorkbook(file: File): Promise<ParsedSheet[]> {
  const { Workbook } = await import("exceljs");
  const wb = new Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const out: ParsedSheet[] = [];
  wb.eachSheet((ws) => {
    const grid: unknown[][] = [];
    ws.eachRow({ includeEmpty: false }, (row) => {
      const vals = row.values as unknown[];
      grid.push(vals.slice(1));
    });
    const s = gridToSheet(ws.name, grid);
    if (s.columns.length) out.push(s);
  });
  return out;
}

export const sapMastersQuery = {
  queryKey: ["sap-masters"] as const,
  queryFn: async (): Promise<SapMaster[]> => {
    const { data, error } = await supabase.from("sap_masters").select("id,name,columns,key_column,row_count,last_uploaded_at").order("name");
    if (error) throw error;
    return data ?? [];
  },
};

export async function getMasterRows(masterId: string): Promise<Record<string, string>[]> {
  const out: Record<string, string>[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("sap_master_rows").select("data").eq("master_id", masterId).order("key_value").range(from, from + 999);
    if (error) throw error;
    out.push(...(data ?? []).map((r) => r.data as Record<string, string>));
    if (!data || data.length < 1000) break;
  }
  return out;
}

/** Dropdown options from any master column (for other screens). */
export async function getMasterOptions(masterName: string, column: string): Promise<string[]> {
  const { data: m } = await supabase.from("sap_masters").select("id").eq("name", masterName).maybeSingle();
  if (!m) return [];
  const rows = await getMasterRows(m.id);
  return [...new Set(rows.map((r) => r[column] ?? "").filter(Boolean))].sort();
}

export async function uploadSheet(sheet: ParsedSheet, keyColumn: string, onProgress: (done: number, total: number) => void) {
  let { data: m } = await supabase.from("sap_masters").select("id").eq("name", sheet.name).maybeSingle();
  if (!m) {
    const ins = await supabase.from("sap_masters").insert({ name: sheet.name, key_column: keyColumn, columns: [] }).select("id").single();
    if (ins.error) throw ins.error;
    m = ins.data;
  } else {
    await supabase.from("sap_masters").update({ key_column: keyColumn }).eq("id", m.id);
  }
  const rows = keyRows(sheet.rows, keyColumn);
  if (!rows.length) {
    const r = await supabase.rpc("upsert_sap_master_rows", { _master_id: m.id, _columns: sheet.columns, _rows: [] });
    if (r.error) throw r.error;
  }
  for (let i = 0; i < rows.length; i += 500) {
    const r = await supabase.rpc("upsert_sap_master_rows", { _master_id: m.id, _columns: sheet.columns, _rows: rows.slice(i, i + 500) });
    if (r.error) throw r.error;
    onProgress(Math.min(i + 500, rows.length), rows.length);
  }
  return rows.length;
}

export async function downloadMasterExcel(name: string, columns: string[], rows: Record<string, string>[]) {
  const { Workbook } = await import("exceljs");
  const wb = new Workbook();
  const ws = wb.addWorksheet(name.slice(0, 31) || "Master");
  const h = ws.addRow(columns); h.font = { bold: true };
  rows.forEach((r) => ws.addRow(columns.map((c) => r[c] ?? "")));
  const blob = new Blob([await wb.xlsx.writeBuffer()]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = datedFileName("SAP MASTER", "xlsx"); a.click();
  URL.revokeObjectURL(url);
}
