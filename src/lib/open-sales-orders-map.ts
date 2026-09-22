import { buildSyncScopeKey, canonicalJson, extractRows, sha256, toIsoDate } from "./zfisales-map";

type Raw = Record<string, unknown>;
const str = (value: unknown) => (value == null ? "" : String(value).trim());
const num = (value: unknown) => { const s = str(value).replace(/,/g, ""); const n = Number(s.endsWith("-") ? `-${s.slice(0, -1)}` : s); return s && Number.isFinite(n) ? n : 0; };
const pick = (row: Raw, keys: string[]) => { for (const key of keys) if (row[key] != null && str(row[key])) return row[key]; return ""; };
const snapshotUuid = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const hex = sha256(`${Date.now()}:${Math.random()}`).slice(0, 32).split(""); hex[12] = "4"; hex[16] = ((Number.parseInt(hex[16] ?? "0", 16) & 3) | 8).toString(16);
  return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20).join("")}`;
};

export function mapOpenSalesOrderRow(raw: Raw, sourceEndpoint: string, syncedAt: string) {
  const salesOrder = str(pick(raw, ["VBELN", "vbeln", "salesOrder"]));
  if (!salesOrder) return null;
  const rowHash = `sha256:${sha256(canonicalJson(raw))}`;
  const quantity = num(pick(raw, ["KWMENG", "KWMENG_C", "quantity"]));
  const openQuantity = pick(raw, ["KWMENG_P", "KWMENG_PC", "OPEN_QTY", "openQuantity"]);
  return {
    record_key: rowHash, sync_scope_key: `endpoint:${sourceEndpoint}`, snapshot_id: "00000000-0000-4000-8000-000000000000", row_hash: rowHash, occurrence_no: 1, is_active_snapshot: false,
    sales_order: salesOrder, sales_order_item: str(pick(raw, ["POSNR", "posnr"])), preceding_document: str(pick(raw, ["VGBEL", "VBELN_P"])), purchase_order: str(pick(raw, ["BSTNK", "bstnk"])), order_type: str(pick(raw, ["AUART", "auart"])),
    order_date: toIsoDate(pick(raw, ["ERDAT", "erdat"])), purchase_order_date: toIsoDate(pick(raw, ["BSTDK", "bstdk"])), delivery_date: toIsoDate(pick(raw, ["DELV_DAT", "VDATU"])),
    sales_org: str(pick(raw, ["VKORG", "vkorg"])), distribution_channel: str(pick(raw, ["VTWEG", "vtweg"])), division: str(pick(raw, ["SPART", "spart"])), plant: str(pick(raw, ["WERKS", "werks"])), sales_office: str(pick(raw, ["VKBUR", "vkbur"])), sales_group: str(pick(raw, ["VKGRP", "vkgrp"])), profit_center: str(pick(raw, ["PRCTR", "prctr"])),
    customer_sold_to: str(pick(raw, ["KUNNR_SP", "KUNNR"])), customer_sold_to_name: str(pick(raw, ["NAME1_SP", "NAME1"])), customer_bill_to: str(pick(raw, ["KUNNR_BP"])), customer_bill_to_name: str(pick(raw, ["NAME1_BP"])), customer_ship_to: str(pick(raw, ["KUNNR_SH"])), customer_ship_to_name: str(pick(raw, ["NAME1_SH"])),
    material: str(pick(raw, ["MATNR", "matnr"])), material_description: str(pick(raw, ["MAKTX", "maktx"])), material_type: str(pick(raw, ["MTART", "mtart"])), product_category: str(pick(raw, ["BEZEI1", "TYPE"])), region: str(pick(raw, ["REGION", "BEZEI"])), country: str(pick(raw, ["LANDX_SP", "LANDX_BP"])), sales_type: str(pick(raw, ["VTEXT_DC", "SALE"])),
    quantity, open_quantity: openQuantity === "" ? quantity : num(openQuantity), unit: str(pick(raw, ["VRKME", "MEINS"])), currency: str(pick(raw, ["WAERK"])), open_value: num(pick(raw, ["P_VALUE", "NETWR", "KWERT_INR"])), days_open: Math.round(num(pick(raw, ["DAYS"]))), delivery_status: str(pick(raw, ["ABSTA"])), overall_status: str(pick(raw, ["GBSTA"])), raw, source_endpoint: sourceEndpoint, synced_at: syncedAt,
  };
}

export function mapOpenSalesOrdersPayload(payload: unknown, sourceEndpoint: string, requestSnapshot?: unknown) {
  const syncedAt = new Date().toISOString(), raws = extractRows(payload), syncScopeKey = buildSyncScopeKey(sourceEndpoint, requestSnapshot), snapshotId = snapshotUuid(), occurrences = new Map<string, number>();
  let invalid = 0, duplicates = 0;
  const rows = raws.flatMap((raw) => { const mapped = mapOpenSalesOrderRow(raw, sourceEndpoint, syncedAt); if (!mapped) { invalid += 1; return []; } const occurrenceNo = (occurrences.get(mapped.row_hash) ?? 0) + 1; occurrences.set(mapped.row_hash, occurrenceNo); if (occurrenceNo > 1) duplicates += 1; return [{ ...mapped, record_key: `snapshot:${sha256(`${syncScopeKey}:${snapshotId}:${mapped.row_hash}:${occurrenceNo}`)}`, sync_scope_key: syncScopeKey, snapshot_id: snapshotId, occurrence_no: occurrenceNo }]; });
  return { received: raws.length, rows, skipped: invalid, invalid, duplicates, syncScopeKey, snapshotId };
}