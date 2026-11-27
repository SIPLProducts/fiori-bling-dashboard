/**
 * Maps the SAP ZAGEING1_NEW (SO Ageing) response into `public.so_ageing` rows.
 * Typed column per SAP field plus the raw row; one snapshot as of P_BUDAT.
 */
import { orderBookNum } from "./order-book-map";
import { sapIsoDate } from "./daily-production-map";

const TEXT: Record<string, string> = { PLANT_NAME: "plant_name", SNAME: "sname", MAKTX: "maktx", MEINS: "meins", PRCTR: "prctr" };
const NUM = ["BUCK1", "VALU1", "BUCK2", "VALU2", "BUCK3", "VALU3", "BUCK4", "VALU4", "CL_STCK", "PRICE"];

export function isSoAgeingEndpoint(name: string): boolean {
  const n = (name ?? "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  return n.includes("soageing") || n.includes("zageing") || n.includes("inventoryaging");
}

const norm = (k: string) => k.replace(/[^a-z0-9]/gi, "").toLowerCase();
function pick(raw: Record<string, unknown>, key: string): unknown {
  if (raw[key] !== undefined) return raw[key];
  const real = Object.keys(raw).find((k) => norm(k) === norm(key));
  return real ? raw[real] : undefined;
}
function text(v: unknown): string | null {
  if (v === undefined || v === null || typeof v === "object") return null;
  const s = String(v).trim();
  return s ? s : null;
}
function extractRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.filter((r) => r && typeof r === "object") as Record<string, unknown>[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    for (const key of ["DATA", "data", "results", "items", "value"]) if (Array.isArray(obj[key])) return extractRows(obj[key]);
  }
  return [];
}
const bucket = (v: unknown) => { const n = parseInt(String(v ?? "").replace(/\D/g, ""), 10); return Number.isFinite(n) ? n : null; };

export function mapSoAgeingPayload(payload: unknown, endpointName: string, request?: unknown, now = new Date()) {
  const source = extractRows(payload);
  const req = request && typeof request === "object" ? (request as Record<string, unknown>) : {};
  let body: Record<string, unknown> = req;
  const b = req["body"];
  if (b && typeof b === "object") body = b as Record<string, unknown>;
  else if (typeof b === "string") { try { const p = JSON.parse(b) as unknown; if (p && typeof p === "object") body = p as Record<string, unknown>; } catch { /* keep request */ } }
  const keyDate = sapIsoDate(body["P_BUDAT"]);
  const bkt = [bucket(body["P2_BKT1"]) ?? 90, bucket(body["P2_BKT2"]) ?? 180, bucket(body["P2_BKT3"]) ?? 365];
  const syncedAt = now.toISOString();
  const byKey = new Map<string, Record<string, unknown>>();
  let invalid = 0;
  for (const raw of source) {
    const matnr = (text(pick(raw, "MATNR")) ?? "").replace(/^0+(?=\d)/, "");
    if (!matnr) { invalid++; continue; }
    const key = { werks: text(pick(raw, "WERKS")) ?? "", lgort: text(pick(raw, "LGORT")) ?? "", matnr, charg: text(pick(raw, "CHARG")) ?? "", mblnr: text(pick(raw, "MBLNR")) ?? "", mjahr: text(pick(raw, "MJAHR")) ?? "" };
    const row: Record<string, unknown> = { ...key, raw, source_endpoint: endpointName, synced_at: syncedAt, key_date: keyDate, bkt1: bkt[0], bkt2: bkt[1], bkt3: bkt[2], bldat: sapIsoDate(pick(raw, "BLDAT")) };
    for (const [k, c] of Object.entries(TEXT)) row[c] = text(pick(raw, k));
    for (const k of NUM) row[k.toLowerCase()] = orderBookNum(pick(raw, k));
    const id = Object.values(key).join("|");
    const prev = byKey.get(id);
    if (prev) for (const k of NUM) { const c = k.toLowerCase(); prev[c] = (Number(prev[c]) || 0) + (Number(row[c]) || 0); }
    else byKey.set(id, row);
  }
  const rows = [...byKey.values()];
  return { received: source.length, rows, invalid, duplicates: source.length - invalid - rows.length };
}

/** Request body: P_BUDAT = always today (IST), buckets zero-padded to 4 digits, posting-range keys dropped. */
export function withSoAgeingDate(raw: string | null | undefined, now: Date = new Date(), scheduled = false): string | undefined {
  if (!raw || !raw.trim()) return raw ?? undefined;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return raw;
    const obj = { ...(parsed as Record<string, unknown>) };
    delete obj["BUDAT_F"]; delete obj["BUDAT_T"];
    const ist = new Date(now.getTime() + 330 * 60000);
    const today = `${ist.getUTCFullYear()}${String(ist.getUTCMonth() + 1).padStart(2, "0")}${String(ist.getUTCDate()).padStart(2, "0")}`;
    const saved = String(obj["P_BUDAT"] ?? "").replace(/-/g, "").trim();
    void saved; void scheduled; obj["P_BUDAT"] = today;
    const defs: Record<string, string> = { P2_BKT1: "0090", P2_BKT2: "0180", P2_BKT3: "0365" };
    for (const k of Object.keys(defs)) { const d = String(obj[k] ?? "").replace(/\D/g, ""); obj[k] = d ? d.padStart(4, "0").slice(-4) : defs[k]; }
    return JSON.stringify(obj);
  } catch {
    return raw;
  }
}
