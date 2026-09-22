/**
 * Mapping helpers for the ZFISALES -> zfisales_detail sync.
 * Pure functions only, so both the server pull and the static-build browser
 * sync can use them.
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

/** Stable JSON representation: object property order from SAP must not affect identity. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`)
    .join(",")}}`;
}

/** Synchronous SHA-256 for deterministic keys in browsers and the Node middleware bundle. */
export function sha256(value: string): string {
  const rightRotate = (n: number, amount: number) => (n >>> amount) | (n << (32 - amount));
  const at = (values: number[], index: number) => values[index] ?? 0;
  const words: number[] = [];
  const bytes = new TextEncoder().encode(value);
  const bitLength = bytes.length * 8;
  for (const byte of bytes) words.push(byte);
  words.push(0x80);
  while (words.length % 64 !== 56) words.push(0);
  const high = Math.floor(bitLength / 0x100000000);
  const low = bitLength >>> 0;
  for (let shift = 24; shift >= 0; shift -= 8) words.push((high >>> shift) & 0xff);
  for (let shift = 24; shift >= 0; shift -= 8) words.push((low >>> shift) & 0xff);

  const primes: number[] = [];
  for (let candidate = 2; primes.length < 64; candidate += 1) {
    if (primes.every((prime) => candidate % prime !== 0)) primes.push(candidate);
  }
  const h = primes.slice(0, 8).map((prime) => (Math.sqrt(prime) * 0x100000000) >>> 0);
  const k = primes.map((prime) => (Math.cbrt(prime) * 0x100000000) >>> 0);

  for (let offset = 0; offset < words.length; offset += 64) {
    const w = new Array<number>(64);
    for (let i = 0; i < 16; i += 1) {
      const byteAt = offset + i * 4;
      w[i] = ((at(words, byteAt) << 24) | (at(words, byteAt + 1) << 16) | (at(words, byteAt + 2) << 8) | at(words, byteAt + 3)) >>> 0;
    }
    for (let i = 16; i < 64; i += 1) {
      const prior15 = at(w, i - 15);
      const prior2 = at(w, i - 2);
      const s0 = rightRotate(prior15, 7) ^ rightRotate(prior15, 18) ^ (prior15 >>> 3);
      const s1 = rightRotate(prior2, 17) ^ rightRotate(prior2, 19) ^ (prior2 >>> 10);
      w[i] = (at(w, i - 16) + s0 + at(w, i - 7) + s1) >>> 0;
    }
    let a = at(h, 0);
    let b = at(h, 1);
    let c = at(h, 2);
    let d = at(h, 3);
    let e = at(h, 4);
    let f = at(h, 5);
    let g = at(h, 6);
    let hh = at(h, 7);
    for (let i = 0; i < 64; i += 1) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (hh + s1 + ch + at(k, i) + at(w, i)) >>> 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;
      hh = g; g = f; f = e; e = (d + temp1) >>> 0; d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }
    const state = [a, b, c, d, e, f, g, hh];
    for (let i = 0; i < 8; i += 1) h[i] = (at(h, i) + at(state, i)) >>> 0;
  }
  return h.map((part) => part.toString(16).padStart(8, "0")).join("");
}

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
  sync_scope_key: string;
  snapshot_id: string;
  row_hash: string;
  occurrence_no: number;
  is_active_snapshot: boolean;
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

  if (!docNo || !fiscalYear) return null;
  const recordKey = `sha256:${sha256(canonicalJson(raw))}`;

  const postingDate = toIsoDate(pickField(raw, ["BUDAT", "budat", "postingDate"]));

  return {
    record_key: recordKey,
    sync_scope_key: `endpoint:${sourceEndpoint}`,
    snapshot_id: "00000000-0000-4000-8000-000000000000",
    row_hash: recordKey,
    occurrence_no: 1,
    is_active_snapshot: false,
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
    pc_short_name: str(pickField(raw, ["ABTEI", "abtei", "PC_SHORT", "PRCTR_SHORT", "KTEXT", "pcShortName"])),
    sub_group: str(pickField(raw, ["SUBGRP1", "SUB_GROUP", "SUBGRP", "subGroup"])),
    new_repl: str(pickField(raw, ["NEW_REPL", "NEWREPL", "newRepl", "BSARK", "bsark"])),
    division_name: str(pickField(raw, ["SPART_DESP", "DIVISION_NAME", "VTEXT_SPART", "divisionName"])),
    industry_name: str(pickField(raw, ["BRSCH_DESP", "INDUSTRY_NAME", "BRTXT_IND", "industryName"])),
    doc_item: posnr,
    material_profit_ctr: str(pickField(raw, ["MAT_PRCTR", "PRCTR_MAT", "matProfitCtr"])),
    material_profit_ctr_name: str(pickField(raw, ["MAT_PRCTR_TXT", "MAT_PRCTR_DESP", "matProfitCtrName"])),
    ah: num(pickField(raw, ["AH", "ah"])),
    sales_zone: str(pickField(raw, ["ZONE", "SALES_ZONE", "BZIRK", "salesZone"])),
    customer_profile: str(pickField(raw, ["CUSPF_DESP", "CUST_PROFILE", "KDGRP_PROFILE", "customerProfile"])),
    amount_domestic: num(pickField(raw, ["DOMESTIC", "domestic"])),
    amount_export: num(pickField(raw, ["EXPORTS", "exports"])),
    amount_service: num(pickField(raw, ["SERVICE", "service"])),
    amount_gross: num(pickField(raw, ["GROSS", "DMBTR_GROS", "gross"])),
    amount_net: num(pickField(raw, ["NET", "net"])),
    excise_duty: num(pickField(raw, ["EXCISEDUTY", "exciseduty"])),
    raw,

    source_endpoint: sourceEndpoint,
    synced_at: syncedAt,
  };
}


export function buildSyncScopeKey(sourceEndpoint: string, requestSnapshot?: unknown): string {
  const request = requestSnapshot && typeof requestSnapshot === "object" && !Array.isArray(requestSnapshot)
    ? requestSnapshot as Record<string, unknown>
    : {};
  const scope = {
    endpoint: sourceEndpoint,
    systemKey: request["systemKey"] ?? null,
    sapClient: request["sapClient"] ?? null,
    path: request["path"] ?? null,
    query: request["query"] ?? null,
    body: request["body"] ?? null,
  };
  return `scope:${sha256(canonicalJson(scope))}`;
}

function snapshotUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const hex = sha256(`${Date.now()}:${Math.random()}`).slice(0, 32).split("");
  hex[12] = "4";
  hex[16] = ((Number.parseInt(hex[16] ?? "0", 16) & 3) | 8).toString(16);
  return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20).join("")}`;
}

export function mapPayload(
  payload: unknown,
  sourceEndpoint: string,
  requestSnapshot?: unknown,
  suppliedSnapshotId?: string,
) {
  const syncedAt = new Date().toISOString();
  const raws = extractRows(payload);
  const rows: ZfisalesDetailRow[] = [];
  const syncScopeKey = buildSyncScopeKey(sourceEndpoint, requestSnapshot);
  const snapshotId = suppliedSnapshotId ?? snapshotUuid();
  const occurrences = new Map<string, number>();
  let invalid = 0;
  let duplicates = 0;
  for (const r of raws) {
    const mapped = mapRow(r, sourceEndpoint, syncedAt);
    if (!mapped) {
      invalid += 1;
      continue;
    }
    const rowHash = mapped.record_key;
    const occurrenceNo = (occurrences.get(rowHash) ?? 0) + 1;
    occurrences.set(rowHash, occurrenceNo);
    if (occurrenceNo > 1) duplicates += 1;
    rows.push({
      ...mapped,
      record_key: `snapshot:${sha256(`${syncScopeKey}:${snapshotId}:${rowHash}:${occurrenceNo}`)}`,
      sync_scope_key: syncScopeKey,
      snapshot_id: snapshotId,
      row_hash: rowHash,
      occurrence_no: occurrenceNo,
      is_active_snapshot: false,
    });
  }
  return { received: raws.length, rows, skipped: invalid, invalid, duplicates, syncScopeKey, snapshotId };
}
