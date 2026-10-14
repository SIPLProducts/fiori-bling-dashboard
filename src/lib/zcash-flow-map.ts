/**
 * Maps the SAP ZCASHFLOWN response into `public.zcash_flow` rows.
 * Rows are upserted on Profit Center + Plant + GL Code (no snapshots).
 * Browser/worker/Node safe: no imports.
 */

export type ZcashFlowRow = {
  profit_center: string;
  plant: string;
  gl_code: string;
  profit_center_name: string | null;
  group_name: string | null;
  gl_name: string | null;
  classification: string | null;
  nature: string | null;
  profit_center_group: string | null;
  debit: number;
  credit: number;
  net: number;
  collection_disbursement: string | null;
  raw: Record<string, unknown>;
  source_endpoint: string;
  synced_at: string;
};

export function isZcashFlowEndpoint(endpointName: string): boolean {
  const n = endpointName.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return n === "zcashflow" || n === "zcashflown";
}

function pick(raw: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) if (raw[k] !== undefined && raw[k] !== null) return raw[k];
  const lower = new Map(Object.keys(raw).map((k) => [k.toLowerCase(), k]));
  for (const k of keys) {
    const real = lower.get(k.toLowerCase());
    if (real && raw[real] !== undefined && raw[real] !== null) return raw[real];
  }
  return undefined;
}

function text(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

/** Numeric with comma removal and SAP trailing minus ("123.45-"). */
export function cashNum(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (v === undefined || v === null) return 0;
  let s = String(v).trim().replace(/,/g, "");
  if (!s) return 0;
  if (s.endsWith("-")) s = "-" + s.slice(0, -1);
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function plantOf(raw: Record<string, unknown>): string {
  const p = pick(raw, ["PLANT"]);
  if (p && typeof p === "object" && !Array.isArray(p)) {
    return text(pick(p as Record<string, unknown>, ["WERKS"])) ?? "";
  }
  return text(p) ?? text(pick(raw, ["WERKS"])) ?? "";
}

export function extractCashRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.filter((r) => r && typeof r === "object") as Record<string, unknown>[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (obj["ERROR_CODE"] !== undefined || obj["MESSAGE"] !== undefined && !Array.isArray(obj["data"])) {
      return [];
    }
    for (const key of ["data", "DATA", "results", "items", "value"]) {
      if (Array.isArray(obj[key])) return extractCashRows(obj[key]);
    }
  }
  return [];
}

export function mapZcashFlowPayload(payload: unknown, endpointName: string, now = new Date()) {
  const source = extractCashRows(payload);
  const syncedAt = now.toISOString();
  const byKey = new Map<string, ZcashFlowRow>();
  let invalid = 0;
  for (const raw of source) {
    const profit_center = text(pick(raw, ["PROFIT_CENTER"])) ?? "";
    const gl_code = text(pick(raw, ["GL_CODE"])) ?? "";
    const plant = plantOf(raw);
    if (!profit_center && !gl_code) { invalid++; continue; }
    // Same key twice in one response: last occurrence wins.
    byKey.set(`${profit_center}|${plant}|${gl_code}`, {
      profit_center, plant, gl_code,
      profit_center_name: text(pick(raw, ["PROFIT_CENTER_NAME"])),
      group_name: text(pick(raw, ["GROUP_NAME"])),
      gl_name: text(pick(raw, ["GL_NAME"])),
      classification: text(pick(raw, ["CLASSIFICATION"])),
      nature: text(pick(raw, ["NATURE"])),
      profit_center_group: text(pick(raw, ["PROFIT_CENTER_GROUP"])),
      debit: cashNum(pick(raw, ["DEBIT"])),
      credit: cashNum(pick(raw, ["CREDIT"])),
      net: cashNum(pick(raw, ["NET"])),
      collection_disbursement: text(pick(raw, ["COLLECTION_DISBURSEMENT"])),
      raw,
      source_endpoint: endpointName,
      synced_at: syncedAt,
    });
  }
  const rows = [...byKey.values()];
  return { received: source.length, rows, invalid, duplicates: source.length - invalid - rows.length };
}
