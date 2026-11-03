/**
 * Maps the SAP Open Purchase Order (ZOPENPO) response into `public.open_purchase_order` rows.
 * Typed column per SAP field plus the raw row; upserted on EBELN + EBELP.
 */
import { orderBookDate, orderBookNum } from "./order-book-map";
import { sapGroupColumns } from "./sap-group-fields";

export const OPEN_PO_TEXT_FIELDS = ["WERKS", "PLT_NAME", "BSART", "LGORT", "EKGRP", "ELIKZ", "LIFNR", "NAME1", "LOEKZ", "MATNR", "TXZ01", "MEINS", "MEINS1", "EKNAM", "BUYER", "CREAT"] as const;
export const OPEN_PO_NUMERIC_FIELDS = ["MENGE", "NETWR", "MENGE1", "DMBTR1", "WRBTR", "LV_MENGE_SUM", "DAYS"] as const;

export function isOpenPoEndpoint(name: string): boolean {
  const n = (name ?? "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  return n.includes("openpurchaseorder") || n === "zopenpo" || n === "openpo";
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

export function mapOpenPoPayload(payload: unknown, endpointName: string, now = new Date()) {
  const source = extractRows(payload);
  const syncedAt = now.toISOString();
  const byKey = new Map<string, Record<string, unknown>>();
  let invalid = 0;
  for (const raw of source) {
    const ebeln = text(pick(raw, "EBELN"));
    if (!ebeln) { invalid++; continue; }
    const ebelp = text(pick(raw, "EBELP")) ?? "";
    const row: Record<string, unknown> = { ebeln, ebelp, raw, source_endpoint: endpointName, synced_at: syncedAt };
    for (const k of OPEN_PO_TEXT_FIELDS) row[k.toLowerCase()] = text(pick(raw, k));
    for (const k of OPEN_PO_NUMERIC_FIELDS) row[k.toLowerCase()] = orderBookNum(pick(raw, k));
    row["bedat"] = orderBookDate(pick(raw, "BEDAT"));
    row["eindt"] = orderBookDate(pick(raw, "EINDT_DT")) ?? orderBookDate(pick(raw, "EINDT"));
    row["datum"] = orderBookDate(pick(raw, "DATUM"));
    Object.assign(row, sapGroupColumns(raw));
    byKey.set(`${ebeln}|${ebelp}`, row);
  }
  const rows = [...byKey.values()];
  return { received: source.length, rows, invalid, duplicates: source.length - invalid - rows.length };
}
