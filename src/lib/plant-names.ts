/** Plant code -> short name cache for the "Plant Short Name" table/Excel column. Filled by usePlantNames(). */
const names = new Map<string, string>();
const norm = (c: unknown) => String(c ?? "").trim().replace(/^0+(?=.)/, "");
export function setPlantNames(rows: { code: unknown; name: unknown }[]) {
  for (const r of rows) if (norm(r.code) && String(r.name ?? "").trim()) names.set(norm(r.code), String(r.name).trim());
}
/** Row's own short name wins; otherwise the shared lookup; blank when unknown or equal to the code. */
export function plantShort(code: unknown, own?: string | null): string {
  const o = String(own ?? "").trim();
  if (o && o !== String(code ?? "").trim()) return o;
  return names.get(norm(code)) ?? "";
}
