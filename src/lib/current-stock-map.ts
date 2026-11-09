/**
 * Maps the SAP MIS Inventory (Current Stock) response into `public.current_stock` rows.
 * Typed column per SAP field plus the raw row; upserted on MATNR + WERKS + LGORT + CHARG.
 */
import { orderBookNum } from "./order-book-map";

export const CURRENT_STOCK_TEXT_FIELDS = ["LGOBE", "MAKTX", "MEINS", "MTART", "ROWNO", "SHELFNO", "RACKNO", "BINNO"] as const;
export const CURRENT_STOCK_NUMERIC_FIELDS = ["LABST", "WLABS", "INSME", "WINSM", "SPEME", "WSPEM", "TRAME", "WTRAM"] as const;

export function isCurrentStockEndpoint(name: string): boolean {
  const n = (name ?? "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  return n.includes("currentstock") || n === "zcurrstk" || n.includes("zdprmisreport");
}

function pick(raw: Record<string, unknown>, key: string): unknown {
  if (raw[key] !== undefined) return raw[key];
  const real = Object.keys(raw).find((k) => k.toLowerCase() === key.toLowerCase());
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
    for (const key of ["data", "DATA", "results", "items", "value"]) if (Array.isArray(obj[key])) return extractRows(obj[key]);
  }
  return [];
}

export function mapCurrentStockPayload(payload: unknown, endpointName: string, now = new Date()) {
  const source = extractRows(payload);
  const syncedAt = now.toISOString();
  const byKey = new Map<string, Record<string, unknown>>();
  let invalid = 0;
  for (const raw of source) {
    const matnr = text(pick(raw, "MATNR"));
    if (!matnr) { invalid++; continue; }
    const werks = text(pick(raw, "WERKS")) ?? "", lgort = text(pick(raw, "LGORT")) ?? "", charg = text(pick(raw, "CHARG")) ?? "";
    const row: Record<string, unknown> = { matnr, werks, lgort, charg, raw, source_endpoint: endpointName, synced_at: syncedAt };
    for (const k of CURRENT_STOCK_TEXT_FIELDS) row[k.toLowerCase()] = text(pick(raw, k));
    for (const k of CURRENT_STOCK_NUMERIC_FIELDS) row[k.toLowerCase()] = orderBookNum(pick(raw, k));
    byKey.set(`${matnr}|${werks}|${lgort}|${charg}`, row);
  }
  const rows = [...byKey.values()];
  return { received: source.length, rows, invalid, duplicates: source.length - invalid - rows.length };
}
