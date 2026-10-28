/**
 * Maps the SAP Sales In Transit (Z_SIT) response into `public.sales_in_transit` rows.
 * Every response field has its own typed column; the full raw row is kept too.
 * Rows are upserted on VBELN + POSNR (no snapshots). Browser/worker/Node safe.
 */
import { orderBookDate, orderBookNum } from "./order-book-map";

export const SIT_TEXT_FIELDS = ["APPTYP", "SECTOR", "WERKS", "NAME1_P", "EXGRP", "VTWEG_AUFT", "MATKL", "VTEXT_DC", "SPART", "VTEXT_SD", "PRCTR", "PRCTR_I", "MCTXT", "MCTXT_I", "KUNAG", "NAME_C", "GSTIN_C", "LANDX50_C", "BEZEI_C", "J_1ICSTNO_C", "KUNNR", "NAME_P", "GSTIN_PY", "KUNNR_S", "NAME_S", "GSTIN_SH", "LANDX50_S", "BEZEI_S", "J_1ICSTNO_S", "KUNNR_RE", "NAME_RE", "GSTIN_RE", "FKART", "VTEXT", "AUBEL", "BSTNK", "MATNR", "HSN_CODE", "ARKTX", "XBLNR", "LIFNR", "VTXT_C", "VTXT_V", "WAERK", "RFBSK", "BEZEI_SO", "BEZEI_SG", "SEGMENT", "ZTERM", "VTEXT_PAY", "NAME_SE", "NAME_TF", "LR_NO", "PREPRN", "EXNUM", "FAWREF", "HKONT", "TXT50", "REMARKS_F2", "NOTI_TEXT", "EX_COM_TEXT", "INCO1", "INCO2", "J_1ICHID", "VBELN_DEL", "MEINS", "VRKME", "MTART", "LAND1", "REGIO", "BUKRS", "KUNNR_SP", "KUNNR_SH", "KUNNR_BP", "BRSCH", "BRTXT", "DIVISION", "INV", "REF", "BELNR1", "BELNR2", "JV3", "JV4", "AUART", "RACCT", "MBLNR", "BELNR3", "TXT500", "AGE", "VBELN_C", "VGBEL", "LGORT", "LGOBE", "DIV_NAME", "MAIN_GRP", "SUB_GRP", "MNGRP1", "PCGRP1", "PCGRP2", "PCGRP3", "AUPOS", "GJAHR1", "GJAHR2", "MJAHR", "CELLCOLOR"] as const;
export const SIT_NUMERIC_FIELDS = ["FKIMG", "KBETR", "NETWR", "NETWR_B", "NETWR_BEX", "NETWR_TOT", "KWERT_D", "KWERT_DEX", "CST", "CST_EX", "TOT_BP", "PRICE_CELL", "PRICE_CELLINR", "VAT", "VAT_EX", "TCS", "TCS_EX", "MWSBK", "MWSBK_EX", "NETWR_T", "NETWR_T_EX", "NETWR_EX", "TAX_RATE", "KWERT_CGST", "KWERT_SGST", "KWERT_IGST", "KURRF", "FRGHT1", "FRGHT1_EX", "FRGHT2", "FRGHT2_EX", "DISCNT", "DISCNT_EX", "KWERT_ZNRC", "KWERT_ZNRC_INR", "SBCESS", "SBCESS_EX", "PFCHRG", "PFCHRG_EX", "SERVI", "SERVI_EX", "ECESS", "ECESS_EX", "SHESS", "SHESS_EX", "JLSR", "JLSR_EX", "ZGST", "ZGST_EX", "ZKKC", "ZKKC_EX", "UMREN", "TOT_AH", "AH", "KWMENG", "UMVKZ", "FKIMG_TOT", "BASIC_AH", "BASIC_AHINR", "DMBTR"] as const;
export const SIT_DATE_FIELDS = ["ERDAT", "FKDAT", "BSTDK", "FKDAT_BILL", "EXDAT", "AUDAT", "LFDAT_DEL", "BUDAT", "PODDATE", "FKDAT_C"] as const;

export type SitRow = Record<string, unknown> & { vbeln: string; posnr: string; raw: Record<string, unknown>; source_endpoint: string; synced_at: string };

/** "Sales_In_Transit", "Z_SIT", "SIT" or a /zsit path. */
export function isSitEndpoint(name: string): boolean {
  const n = (name ?? "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  return n.includes("salesintransit") || n === "sit" || n === "zsit" || /(^|[^a-z])z?_?sit([^a-z]|$)/i.test(name ?? "");
}

function pick(raw: Record<string, unknown>, key: string): unknown {
  if (raw[key] !== undefined) return raw[key];
  const real = Object.keys(raw).find((k) => k.toLowerCase() === key.toLowerCase());
  return real ? raw[real] : undefined;
}

function text(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v === "object") { const s = JSON.stringify(v); return s === "[]" || s === "{}" ? null : s; }
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

export function mapSitPayload(payload: unknown, endpointName: string, now = new Date()) {
  const source = extractRows(payload);
  const syncedAt = now.toISOString();
  const byKey = new Map<string, SitRow>();
  let invalid = 0;
  for (const raw of source) {
    const vbeln = text(pick(raw, "VBELN"));
    const posnr = text(pick(raw, "POSNR"));
    if (!vbeln || !posnr) { invalid++; continue; }
    const row: SitRow = { vbeln, posnr, raw, source_endpoint: endpointName, synced_at: syncedAt };
    for (const k of SIT_TEXT_FIELDS) row[k.toLowerCase()] = text(pick(raw, k));
    for (const k of SIT_NUMERIC_FIELDS) row[k.toLowerCase()] = orderBookNum(pick(raw, k));
    for (const k of SIT_DATE_FIELDS) row[k.toLowerCase()] = orderBookDate(pick(raw, k));
    byKey.set(`${vbeln}|${posnr}`, row);
  }
  const rows = [...byKey.values()];
  return { received: source.length, rows, invalid, duplicates: source.length - invalid - rows.length };
}

/** Keys stored in the table but absent from the latest SAP response (to be deleted). */
export function staleSitKeys(existing: { vbeln: string; posnr: string }[], incoming: { vbeln: string; posnr: string }[]) {
  const keep = new Set(incoming.map((r) => `${r.vbeln}|${r.posnr}`));
  return existing.filter((r) => !keep.has(`${r.vbeln}|${r.posnr}`));
}
