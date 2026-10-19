/**
 * Maps the SAP ZORDERBOOK response into `public.order_book` rows.
 * Every response field has its own typed column; the full raw row is kept too.
 * Rows are upserted on VBELN + POSNR (no snapshots). Browser/worker/Node safe.
 */

/** SAP key → column for identity/access fields. */
const RENAMED: Record<string, string> = {
  VBELN: "sales_order",
  POSNR: "sales_order_item",
  WERKS: "plant",
  PC_CODE: "profit_center",
  ERDAT: "created_date",
};

export const ORDER_BOOK_TEXT_FIELDS = [
  "APPTYP", "SECTOR", "VTWEG", "SPART", "WERKS", "VBELN", "AUART", "KUNNR_SP", "NAME1_SP", "KUNNR_BP", "NAME1_BP",
  "KUNNR_SH", "NAME1_SH", "BSTNK", "POSNR", "MATNR", "MAKTX", "VRKME", "WAERK", "ZTERM", "PAY_VTEXT", "DELV_DAT",
  "WARTY", "INCO1", "LD_TERMS", "VKBUR", "NAME1_SE", "VTEXT_DC", "VTEXT_DI", "INCO2", "MEINS", "BEZEI", "LANDX_SP",
  "BEZEI_SP", "LANDX_BP", "BEZEI_BP", "LANDX_SH", "BEZEI_SH", "VGBEL", "PROJ", "VKGRP", "YEAR", "ABSTA", "GBSTA",
  "BUY_BACK", "BUY_BACK_DETAIL", "UNLOAD", "PLANT_NAME", "DIV_NAME", "PC_CODE", "PC_NAME", "MAIN_GRP", "SUB_GRP",
] as const;

export const ORDER_BOOK_NUMERIC_FIELDS = [
  "KWMENG", "KWMENG_P", "STCUR", "KBETR", "KWMENG_C", "KWMENG_PC", "P_VALUE", "KWERT_BA", "KWERT_BC", "KWERT_BCI",
  "KWERT_DS", "KWERT_ED", "KWERT_CST", "KWERT_VAT", "KWERT_ST", "KWERT_SW", "KWERT_GST", "KWERT_KKC", "KWERT_VSC",
  "NETWR", "KWERT_FR", "ZNRC", "ZCOM", "ZPF1", "ZTAX", "ZDST", "KF00", "ZF01", "ZF02", "KURSK", "TOT_INR", "NET_INR",
  "UMREN", "TOT_AH", "BASIC_AH", "BASIC_AHINR", "UMVKZ", "TWAR", "KWERT_ZSBP", "KWERT_ZSF1", "KWERT_ZSF2",
] as const;

export const ORDER_BOOK_DATE_FIELDS = ["ERDAT", "BSTDK"] as const;

export const orderBookColumn = (sapKey: string) => RENAMED[sapKey] ?? sapKey.toLowerCase();

export type OrderBookRow = Record<string, unknown> & {
  sales_order: string;
  sales_order_item: string;
  raw: Record<string, unknown>;
  source_endpoint: string;
  synced_at: string;
};

export function isOrderBookEndpoint(endpointName: string): boolean {
  return endpointName.replace(/[^a-z0-9]/gi, "").toLowerCase().includes("orderbook");
}

function pick(raw: Record<string, unknown>, key: string): unknown {
  if (raw[key] !== undefined) return raw[key];
  const real = Object.keys(raw).find((k) => k.toLowerCase() === key.toLowerCase());
  return real ? raw[real] : undefined;
}

function text(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

/** Space-padded / comma / trailing-minus SAP numbers → number (blank = 0). */
export function orderBookNum(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (v === undefined || v === null) return 0;
  let s = String(v).trim().replace(/,/g, "");
  if (!s) return 0;
  if (s.endsWith("-")) s = "-" + s.slice(0, -1);
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

/** "2025-06-02" / "20250602" / "02.06.2025" → ISO date; anything else null. */
export function orderBookDate(v: unknown): string | null {
  const s = text(v);
  if (!s || /^0+$/.test(s.replace(/\D/g, ""))) return null;
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}

function extractRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.filter((r) => r && typeof r === "object") as Record<string, unknown>[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    for (const key of ["data", "DATA", "results", "items", "value"]) {
      if (Array.isArray(obj[key])) return extractRows(obj[key]);
    }
  }
  return [];
}

export function mapOrderBookPayload(payload: unknown, endpointName: string, now = new Date()) {
  const source = extractRows(payload);
  const syncedAt = now.toISOString();
  const byKey = new Map<string, OrderBookRow>();
  let invalid = 0;
  for (const raw of source) {
    const vbeln = text(pick(raw, "VBELN"));
    const posnr = text(pick(raw, "POSNR"));
    if (!vbeln || !posnr) { invalid++; continue; }
    const row: OrderBookRow = { sales_order: vbeln, sales_order_item: posnr, raw, source_endpoint: endpointName, synced_at: syncedAt };
    for (const k of ORDER_BOOK_TEXT_FIELDS) if (k !== "VBELN" && k !== "POSNR") row[orderBookColumn(k)] = text(pick(raw, k));
    for (const k of ORDER_BOOK_NUMERIC_FIELDS) row[orderBookColumn(k)] = orderBookNum(pick(raw, k));
    for (const k of ORDER_BOOK_DATE_FIELDS) row[orderBookColumn(k)] = orderBookDate(pick(raw, k));
    // Same order line twice in one response: last occurrence wins.
    byKey.set(`${vbeln}|${posnr}`, row);
  }
  const rows = [...byKey.values()];
  return { received: source.length, rows, invalid, duplicates: source.length - invalid - rows.length };
}
