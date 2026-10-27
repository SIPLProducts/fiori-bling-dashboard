/**
 * Maps the SAP Purchase Register (ZPUREGST) response into `public.purchase_register` rows.
 * Typed column per SAP field plus the raw row; upserted on BELNR + BUZEI + MBLNR + ZEILE.
 */
import { orderBookDate, orderBookNum } from "./order-book-map";

export const PURCHASE_REGISTER_TEXT_FIELDS = ["WERKS", "NAME1_WER", "PRCTR", "PTEXT", "LIFNR", "NAME1", "MTBEZ", "MATNR", "MAKTX", "MEINS_I", "MWSKZ", "TEXT1_M", "BWART", "MEINS_G", "WAERS", "SHKZG", "TY_PURCH", "TY_MAT"] as const;
export const PURCHASE_REGISTER_NUMERIC_FIELDS = ["MENGE_I", "MENGE_G", "WRBTR", "KURSF", "DIS", "OTH", "PLAN_DEL", "TAX", "SGST", "CGST", "IGST", "NO_CR", "GL_ACC", "TOTAL", "NET_AMT", "GROSS_PRICE", "NET_PRICE"] as const;
export const PURCHASE_REGISTER_DATE_FIELDS = ["BUDAT", "AEDAT", "CREATE_DT"] as const;

export function isPurchaseRegisterEndpoint(name: string): boolean {
  return (name ?? "").replace(/[^a-z0-9]/gi, "").toLowerCase().includes("purchaseregister");
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

export function mapPurchaseRegisterPayload(payload: unknown, endpointName: string, now = new Date()) {
  const source = extractRows(payload);
  const syncedAt = now.toISOString();
  const byKey = new Map<string, Record<string, unknown>>();
  let invalid = 0;
  for (const raw of source) {
    const belnr = text(pick(raw, "BELNR"));
    if (!belnr) { invalid++; continue; }
    const buzei = text(pick(raw, "BUZEI")) ?? "";
    const mblnr = text(pick(raw, "MBLNR")) ?? "";
    const zeile = text(pick(raw, "ZEILE")) ?? "";
    const row: Record<string, unknown> = { belnr, buzei, mblnr, zeile, raw, source_endpoint: endpointName, synced_at: syncedAt };
    for (const k of PURCHASE_REGISTER_TEXT_FIELDS) row[k.toLowerCase()] = text(pick(raw, k));
    for (const k of PURCHASE_REGISTER_NUMERIC_FIELDS) row[k.toLowerCase()] = orderBookNum(pick(raw, k));
    for (const k of PURCHASE_REGISTER_DATE_FIELDS) row[k.toLowerCase()] = orderBookDate(pick(raw, k));
    byKey.set(`${belnr}|${buzei}|${mblnr}|${zeile}`, row);
  }
  const rows = [...byKey.values()];
  return { received: source.length, rows, invalid, duplicates: source.length - invalid - rows.length };
}
