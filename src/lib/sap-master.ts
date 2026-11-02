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
export const ROW_KEY = "__row__";
/** Pure: key value for a row; keyColumn may join several columns with "+", or be ROW_KEY (row position). */
export function buildKey(row: Record<string, string>, keyColumn: string, index = 0): string {
  if (keyColumn === ROW_KEY) return String(index + 1).padStart(7, "0");
  const parts = keyColumn.split("+").map((c) => (row[c] ?? "").trim());
  return parts.every((p) => !p) ? "" : parts.join(" | ");
}
export function countUniqueKeys(rows: Record<string, string>[], keyColumn: string): number {
  return new Set(rows.map((r, i) => buildKey(r, keyColumn, i)).filter(Boolean)).size;
}
export function keyLabel(keyColumn: string) { return keyColumn === ROW_KEY ? "None (every row kept)" : keyColumn.split("+").join(" + "); }

export function keyRows(rows: Record<string, string>[], keyColumn: string): MasterRow[] {
  const map = new Map<string, Record<string, string>>();
  for (const [i, r] of rows.entries()) {
    const k = buildKey(r, keyColumn, i);
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

export type MasterCategory = "sap_master" | "zrmmat";
export const mastersQuery = (category: MasterCategory = "sap_master") => ({
  queryKey: ["sap-masters", category] as const,
  queryFn: async (): Promise<SapMaster[]> => {
    const { data, error } = await supabase.from("sap_masters").select("id,name,columns,key_column,row_count,last_uploaded_at").eq("category", category).order("name");
    if (error) throw error;
    return data ?? [];
  },
});
export const sapMastersQuery = mastersQuery("sap_master");

export type EditableRow = { id: string; data: Record<string, string> };
export async function getMasterRowsWithId(masterId: string): Promise<EditableRow[]> {
  const out: EditableRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("sap_master_rows").select("id,data").eq("master_id", masterId).order("key_value").range(from, from + 999);
    if (error) throw error;
    out.push(...(data ?? []).map((r) => ({ id: r.id, data: r.data as Record<string, string> })));
    if (!data || data.length < 1000) break;
  }
  return out;
}

async function refreshCount(masterId: string) {
  const { count } = await supabase.from("sap_master_rows").select("id", { count: "exact", head: true }).eq("master_id", masterId);
  await supabase.from("sap_masters").update({ row_count: count ?? 0 }).eq("id", masterId);
}

/** Save one edited row; key_value follows the master's key column. */
export async function updateMasterRow(masterId: string, keyColumn: string, id: string, data: Record<string, string>) {
  if (keyColumn === ROW_KEY) {
    const { error } = await supabase.from("sap_master_rows").update({ data }).eq("id", id);
    if (error) throw error;
    return;
  }
  const key = buildKey(data, keyColumn);
  if (!key) throw new Error(`${keyLabel(keyColumn)} is required`);
  const { error } = await supabase.from("sap_master_rows").update({ data, key_value: key }).eq("id", id);
  if (error) throw error;
}

export async function addMasterRow(masterId: string, keyColumn: string, data: Record<string, string>) {
  const key = keyColumn === ROW_KEY ? `9${Date.now()}` : buildKey(data, keyColumn);
  if (!key) throw new Error(`${keyLabel(keyColumn)} is required`);
  const { error } = await supabase.from("sap_master_rows").insert({ master_id: masterId, key_value: key, data });
  if (error) throw error;
  await refreshCount(masterId);
}

export async function deleteMasterRows(masterId: string, ids: string[]) {
  for (let i = 0; i < ids.length; i += 200) {
    const { error } = await supabase.from("sap_master_rows").delete().in("id", ids.slice(i, i + 200));
    if (error) throw error;
  }
  await refreshCount(masterId);
}

export async function deleteMaster(masterId: string) {
  const r = await supabase.from("sap_master_rows").delete().eq("master_id", masterId);
  if (r.error) throw r.error;
  const { error } = await supabase.from("sap_masters").delete().eq("id", masterId);
  if (error) throw error;
}

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
  const { data: m } = await supabase.from("sap_masters").select("id").eq("category", "sap_master").eq("name", masterName).maybeSingle();
  if (!m) return [];
  const rows = await getMasterRows(m.id);
  return [...new Set(rows.map((r) => r[column] ?? "").filter(Boolean))].sort();
}

export async function uploadSheet(sheet: ParsedSheet, keyColumn: string, onProgress: (done: number, total: number) => void, category: MasterCategory = "sap_master") {
  let { data: m } = await supabase.from("sap_masters").select("id").eq("category", category).eq("name", sheet.name).maybeSingle();
  if (!m) {
    const ins = await supabase.from("sap_masters").insert({ category, name: sheet.name, key_column: keyColumn, columns: [] }).select("id").single();
    if (ins.error) throw ins.error;
    m = ins.data;
  } else {
    await supabase.from("sap_masters").update({ key_column: keyColumn }).eq("id", m.id);
  }
  if (keyColumn === ROW_KEY) {
    const d = await supabase.from("sap_master_rows").delete().eq("master_id", m.id);
    if (d.error) throw d.error;
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

export async function downloadMasterExcel(name: string, columns: string[], rows: Record<string, string>[], screen = "SAP MASTER") {
  const { Workbook } = await import("exceljs");
  const wb = new Workbook();
  const ws = wb.addWorksheet(name.slice(0, 31) || "Master");
  const h = ws.addRow(columns); h.font = { bold: true };
  rows.forEach((r) => ws.addRow(columns.map((c) => r[c] ?? "")));
  const blob = new Blob([await wb.xlsx.writeBuffer()]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = datedFileName(screen, "xlsx"); a.click();
  URL.revokeObjectURL(url);
}

/** Pure: unique sorted {value,label} options from master rows; label "code - desc" when a description column is given. */
export function buildMasterOptions(rows: Record<string, string>[], column: string, descColumn?: string): { value: string; label: string }[] {
  const map = new Map<string, string>();
  for (const r of rows) {
    const code = String(r[column] ?? "").trim();
    if (!code || map.has(code)) continue;
    const desc = descColumn ? String(r[descColumn] ?? "").trim() : "";
    map.set(code, desc ? `${code} - ${desc}` : code);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true })).map(([value, label]) => ({ value, label }));
}

/** Rows of one master by sheet name (stable query; refreshed by uploads invalidating ["sap-master-rows"]). */
export const masterRowsByNameQuery = (masterName: string) => ({
  queryKey: ["sap-master-rows", "by-name", masterName] as const,
  queryFn: async (): Promise<Record<string, string>[]> => {
    const { data: m } = await supabase.from("sap_masters").select("id").eq("category", "sap_master").eq("name", masterName).maybeSingle();
    return m ? getMasterRows(m.id) : [];
  },
  staleTime: Infinity,
});
