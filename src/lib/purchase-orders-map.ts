/**
 * Maps the SAP Purchase Orders (ZME2N) response into `public.purchase_orders` rows.
 * Typed column per SAP field plus the raw row; upserted on PO + PO_ITEM.
 */
import { orderBookDate, orderBookNum } from "./order-book-map";
import { sapGroupColumns } from "./sap-group-fields";

/** ZPO_LIST (/zpo_list/polist) keys → existing ZME2N columns. */
const ALIASES: Record<string, string[]> = {
  PO: ["EBELN"], PO_ITEM: ["EBELP"], DELIVERY_DATE: ["EINDT"], PO_DOC_TYPE: ["BSART"], NAME_OF_VENDOR: ["SUPERFIELD"],
  PURCHASING_GROUP: ["EKGRP"], MATERIAL: ["EMATN", "MATNR"], SHORT_TEXT: ["TXZ01"], PLANT: ["WERKS"], STORAGE_LOCATION: ["LGORT"],
  ORDER_QUANTITY: ["MENGE"], ORDER_UNIT: ["MEINS"], NET_PRICE: ["NETPR"], PRICE_UNIT: ["PEINH"], CURRENCY_KEY: ["WAERS"],
  NET_ORDER_VALUE: ["NETWR"],
};

export const PO_TEXT_FIELDS = [
  "PO_DOC_TYPE", "PO_DOC_CATEGORY", "VENDOR_SUPPLYING_PLANT", "PURCHASE_ORG", "PURCHASING_GROUP", "MATERIAL", "SHORT_TEXT",
  "MATERIAL_GROUP", "PO_HISTORY_RELEASE_DOC", "DELETION_IND", "ITEM_CATEGORY", "ITEM_CATEGORY_EPSTP", "ACCOUNT_ASSIGNMENT_CAT",
  "TRACKING_NUMBER", "PLANT", "PLT_NAME", "PLT_SHORT", "STORAGE_LOCATION", "ORDER_UNIT", "CURRENCY_KEY", "AGREEMENT", "RFQ_STATUS",
  "COLLECTIVE_NO", "PURCHASING_INFO_REC", "RELEASE_GROUP", "RELEASE_STRATEGY", "RELEASE_STATUS", "RELEASE_INDICATOR",
  "NAME_OF_VENDOR", "ORDER_PRICE_UNIT", "TAX_CODE", "ASSET_CODE", "WBS_ELEMENT", "ZZBANFN", "ZZITEXT", "ZZINTER", "ZZSTEUC",
  "USER_ID", "USER_NAME", "BUYER",
] as const;
export const PO_NUMERIC_FIELDS = [
  "NO_OF_DAYS", "ORDER_QUANTITY", "NET_PRICE", "PRICE_UNIT", "AGREEMENT_ITEM", "STILL_TO_BE_DELIVERED_QTY", "STILL_TO_BE_DELIVERED_VAL",
  "STILL_TO_BE_INVOICED_QTY", "STILL_TO_BE_INVOICED_VAL", "NO_OF_POSITIONS", "PACKAGE_NO", "NET_ORDER_VALUE",
] as const;

/** ZME2N endpoint (named Purchase_Orders). Must not match Open Purchase Orders. */
export function isPurchaseOrdersEndpoint(name: string): boolean {
  const n = (name ?? "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  return n.includes("zme2n") || n.includes("zpolist") || n.includes("polist") || n.startsWith("me2n") || n === "purchaseorders" || n === "purchaseorder";
}

function pick1(raw: Record<string, unknown>, key: string): unknown {
  if (raw[key] !== undefined) return raw[key];
  const real = Object.keys(raw).find((k) => k.toLowerCase() === key.toLowerCase());
  return real ? raw[real] : undefined;
}
function pick(raw: Record<string, unknown>, key: string): unknown {
  for (const k of [key, ...(ALIASES[key] ?? [])]) {
    const v = pick1(raw, k);
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return undefined;
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

export function mapPurchaseOrdersPayload(payload: unknown, endpointName: string, now = new Date()) {
  const source = extractRows(payload);
  const syncedAt = now.toISOString();
  const byKey = new Map<string, Record<string, unknown>>();
  let invalid = 0;
  for (const raw of source) {
    const po = text(pick(raw, "PO"));
    if (!po) { invalid++; continue; }
    const poItem = text(pick(raw, "PO_ITEM")) ?? "";
    const row: Record<string, unknown> = { po, po_item: poItem, raw, source_endpoint: endpointName, synced_at: syncedAt };
    for (const k of PO_TEXT_FIELDS) row[k.toLowerCase()] = text(pick(raw, k));
    for (const k of PO_NUMERIC_FIELDS) row[k.toLowerCase()] = orderBookNum(pick(raw, k));
    row["po_date"] = orderBookDate(pick(raw, "PO_DATE"));
    row["delivery_date"] = orderBookDate(pick(raw, "DELIVERY_DATE"));
    row["doc_date"] = orderBookDate(pick(raw, "DOC_DATE"));
    Object.assign(row, sapGroupColumns(raw));
    row["division_name"] = text(pick(raw, "DIVISION_NAME"));
    row["ekgrp_desc"] = text(pick(raw, "EKGRP_DESC"));
    byKey.set(`${po}|${poItem}`, row);
  }
  const rows = [...byKey.values()];
  return { received: source.length, rows, invalid, duplicates: source.length - invalid - rows.length };
}
