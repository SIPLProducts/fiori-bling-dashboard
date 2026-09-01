/**
 * Server-only mapping helpers for the ZFISALES → zfisales_detail sync.
 */

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

type Raw = Record<string, unknown>;

const str = (v: unknown) => (v == null ? "" : String(v).trim());

/** Accepts YYYYMMDD, YYYY-MM-DD, or /Date(…)/ and returns YYYY-MM-DD (or null). */
export function toIsoDate(value: unknown): string | null {
  const s = str(value);
  if (!s) return null;
  const odata = /\/Date\((-?\d+)\)\//.exec(s);
  if (odata) return new Date(Number(odata[1])).toISOString().slice(0, 10);
  if (/^\d{8}$/.test(s)) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function monthLabel(iso: string | null) {
  if (!iso) return "";
  const [y, m] = iso.split("-");
  return `${MONTHS[Number(m) - 1] ?? ""}-${y}`;
}

function num(value: unknown): number {
  const s = str(value).replace(/,/g, "");
  if (!s) return 0;
  const neg = /-$/.test(s);
  const n = Number(neg ? `-${s.slice(0, -1)}` : s);
  return Number.isFinite(n) ? n : 0;
}

const pickField = (row: Raw, keys: string[]) => {
  for (const k of keys) {
    if (row[k] != null && str(row[k]) !== "") return row[k];
  }
  return "";
};

/** Unwraps arrays, `{ d: { results } }`, `{ results }`, `{ data }`, `{ rows }`. */
export function extractRows(payload: unknown): Raw[] {
  if (Array.isArray(payload)) return payload as Raw[];
  if (payload && typeof payload === "object") {
    const o = payload as Raw;
    const d = o["d"] as Raw | undefined;
    if (d && Array.isArray(d["results"])) return d["results"] as Raw[];
    for (const key of ["results", "data", "rows", "items", "ITEMS", "ET_DATA"]) {
      if (Array.isArray(o[key])) return o[key] as Raw[];
    }
  }
  return [];
}

export type ZfisalesDetailRow = {
  record_key: string;
  plant: string;
  gl: string;
  gl_name: string;
  profit_ctr: string;
  profit_ctr_name: string;
  grp: string;
  sales_type: string;
  company_code: string;
  company_name: string;
  customer: string;
  customer_name: string;
  fiscal_year: string;
  doc_no: string;
  doc_date: string | null;
  posting_date: string | null;
  month: string;
  reference: string;
  doc_type: string;
  pk: string;
  amount: number;
  segment: string;
  sales_order: string;
  sales_order_item: string;
  material: string;
  material_desc: string;
  quantity: number;
  unit: string;
  division: string;
  industry: string;
  sales_office: string;
  branch: string;
  country_code: string;
  country_name: string;
  model: string;
  product_type: string;
  product_range: string;
  product_group: string;
  main_group: string;
  customer_group: string;
  usage_desc: string;
  sales_org: string;
  incoterms: string;
  sales_rep: string;
  sales_rep_name: string;
  total_ah: number;
  pc_short_name: string;
  sub_group: string;
  new_repl: string;
  division_name: string;
  industry_name: string;
  doc_item: string;
  material_profit_ctr: string;
  material_profit_ctr_name: string;
  ah: number;
  sales_zone: string;
  customer_profile: string;
  amount_domestic: number;
  amount_export: number;
  amount_service: number;
  amount_gross: number;
  amount_net: number;
  excise_duty: number;

  raw: unknown;
  source_endpoint: string;
  synced_at: string;
};


export function mapRow(raw: Raw, sourceEndpoint: string, syncedAt: string): ZfisalesDetailRow | null {
  const plant = str(pickField(raw, ["WERKS", "werks", "plant"]));
  const fiscalYear = str(pickField(raw, ["GJAHR", "gjahr", "fiscalYear"]));
  const docNo = str(pickField(raw, ["BELNR", "belnr", "docNo"]));
  const posnr = str(pickField(raw, ["POSNR", "BUZEI", "posnr", "item"]));
  const gl = str(pickField(raw, ["HKONT", "SAKNR", "hkont", "gl"]));

  const recordKey = [plant, fiscalYear, docNo, posnr, gl].join("|");
  if (!docNo || !fiscalYear) return null;

  const postingDate = toIsoDate(pickField(raw, ["BUDAT", "budat", "postingDate"]));

  return {
    record_key: recordKey,
    plant,
    gl,
    gl_name: str(pickField(raw, ["TXT50", "HKONT_TXT", "glName", "SAKNR_TXT"])),
    profit_ctr: str(pickField(raw, ["PRCTR", "PRCTR1", "prctr", "profitCtr"])),
    profit_ctr_name: str(pickField(raw, ["LTEXT", "RTEXT", "PRCTR_TXT", "KTEXT", "profitCtrName"])),
    grp: str(pickField(raw, ["GROUP", "PCGRP1", "MNGRP1", "GRUPPE", "group", "grp"])),
    sales_type: str(pickField(raw, ["SALE", "SALES_TYPE", "SALESTYPE", "salesType", "AUART"])),
    company_code: str(pickField(raw, ["BUKRS", "bukrs", "companyCode"])) || plant,
    company_name: str(pickField(raw, ["BUTXT", "companyName", "LTEXT", "VTEXT"])),
    customer: str(pickField(raw, ["KUNNR", "kunnr", "customer"])),
    customer_name: str(pickField(raw, ["NAME1", "KUNNR_TXT", "customerName"])),
    fiscal_year: fiscalYear,
    doc_no: docNo,
    doc_date: toIsoDate(pickField(raw, ["BLDAT", "bldat", "docDate"])),
    posting_date: postingDate,
    month: str(pickField(raw, ["MONTH", "month"])) || monthLabel(postingDate),
    reference: str(pickField(raw, ["XBLNR", "xblnr", "reference"])),
    doc_type: str(pickField(raw, ["BLART", "blart", "docType"])),
    pk: str(pickField(raw, ["BSCHL", "bschl", "pk"])),
    amount: num(pickField(raw, ["DMBTR", "dmbtr", "amount", "WRBTR"])),
    segment: str(pickField(raw, ["SEGMENT", "segment", "SEGEMNT", "SEGMENT_TXT"])),
    sales_order: str(pickField(raw, ["AUBEL", "aubel", "salesOrder"])),
    sales_order_item: str(pickField(raw, ["AUPOS", "aupos"])),
    material: str(pickField(raw, ["MATNR", "matnr", "material"])),
    material_desc: str(pickField(raw, ["MAKTX", "maktx", "materialDesc"])),
    quantity: num(pickField(raw, ["MENGE", "menge", "quantity"])),
    unit: str(pickField(raw, ["MEINS", "meins", "unit"])),
    division: str(pickField(raw, ["SPART", "spart", "division"])),
    industry: str(pickField(raw, ["BRSCH", "brsch", "industry"])),
    sales_office: str(pickField(raw, ["VTEXT", "vtext", "salesOffice"])),
    branch: str(pickField(raw, ["BRTXT", "brtxt", "branch"])),
    country_code: str(pickField(raw, ["LAND1", "land1", "countryCode"])),
    country_name: str(pickField(raw, ["LANDX50", "LANDX", "landx50", "countryName"])),
    model: str(pickField(raw, ["MODEL", "model"])),
    product_type: str(pickField(raw, ["TYPE", "type"])),
    product_range: str(pickField(raw, ["RANGE", "range"])),
    product_group: str(pickField(raw, ["PCGRP1", "pcgrp1", "productGroup"])),
    main_group: str(pickField(raw, ["MNGRP1", "mngrp1", "mainGroup"])),
    customer_group: str(pickField(raw, ["KDGRP_DESP", "KDGRP", "customerGroup"])),
    usage_desc: str(pickField(raw, ["ABRVW_DESP", "ABRVW", "usage"])),
    sales_org: str(pickField(raw, ["SALES_ORG_DESP", "VKORG", "salesOrg"])),
    incoterms: str(pickField(raw, ["INCO1", "inco1", "incoterms"])),
    sales_rep: str(pickField(raw, ["LIFNR", "lifnr", "salesRep"])),
    sales_rep_name: str(pickField(raw, ["NAME11", "name11", "salesRepName"])),
    total_ah: num(pickField(raw, ["TOT_AH", "tot_ah"])),
    pc_short_name: str(pickField(raw, ["PC_SHORT", "PRCTR_SHORT", "KTEXT", "pcShortName"])),
    sub_group: str(pickField(raw, ["SUBGRP1", "SUB_GROUP", "SUBGRP", "subGroup"])),
    new_repl: str(pickField(raw, ["NEW_REPL", "NEWREPL", "newRepl"])),
    division_name: str(pickField(raw, ["SPART_DESP", "DIVISION_NAME", "VTEXT_SPART", "divisionName"])),
    industry_name: str(pickField(raw, ["BRSCH_DESP", "INDUSTRY_NAME", "BRTXT_IND", "industryName"])),
    doc_item: posnr,
    material_profit_ctr: str(pickField(raw, ["MAT_PRCTR", "PRCTR_MAT", "matProfitCtr"])),
    material_profit_ctr_name: str(pickField(raw, ["MAT_PRCTR_TXT", "MAT_PRCTR_DESP", "matProfitCtrName"])),
    ah: num(pickField(raw, ["AH", "ah"])),
    sales_zone: str(pickField(raw, ["ZONE", "SALES_ZONE", "BZIRK", "salesZone"])),
    customer_profile: str(pickField(raw, ["CUST_PROFILE", "KDGRP_PROFILE", "customerProfile"])),
    raw,
    source_endpoint: sourceEndpoint,
    synced_at: syncedAt,
  };
}


export function mapPayload(payload: unknown, sourceEndpoint: string) {
  const syncedAt = new Date().toISOString();
  const raws = extractRows(payload);
  const rows: ZfisalesDetailRow[] = [];
  const seen = new Set<string>();
  let skipped = 0;
  for (const r of raws) {
    const mapped = mapRow(r, sourceEndpoint, syncedAt);
    if (!mapped) {
      skipped += 1;
      continue;
    }
    if (seen.has(mapped.record_key)) {
      // Last one wins within a single payload.
      const idx = rows.findIndex((x) => x.record_key === mapped.record_key);
      rows[idx] = mapped;
      continue;
    }
    seen.add(mapped.record_key);
    rows.push(mapped);
  }
  return { received: raws.length, rows, skipped };
}
