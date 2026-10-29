// <define:import.meta.env>
var define_import_meta_env_default = {};

// ../src/lib/zfisales-map.ts
var MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
var str = (v) => v == null ? "" : String(v).trim();
function toIsoDate(value) {
  const s = str(value);
  if (!s) return null;
  const odata = /\/Date\((-?\d+)\)\//.exec(s);
  if (odata) return new Date(Number(odata[1])).toISOString().slice(0, 10);
  if (/^\d{8}$/.test(s)) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}
function monthLabel(iso) {
  if (!iso) return "";
  const [y, m] = iso.split("-");
  return `${MONTHS[Number(m) - 1] ?? ""}-${y}`;
}
function num(value) {
  const s = str(value).replace(/,/g, "");
  if (!s) return 0;
  const neg = /-$/.test(s);
  const n = Number(neg ? `-${s.slice(0, -1)}` : s);
  return Number.isFinite(n) ? n : 0;
}
var pickField = (row, keys) => {
  for (const k of keys) {
    if (row[k] != null && str(row[k]) !== "") return row[k];
  }
  return "";
};
function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const object = value;
  return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`).join(",")}}`;
}
function sha256(value) {
  const rightRotate = (n, amount) => n >>> amount | n << 32 - amount;
  const at = (values, index) => values[index] ?? 0;
  const words = [];
  const bytes = new TextEncoder().encode(value);
  const bitLength = bytes.length * 8;
  for (const byte of bytes) words.push(byte);
  words.push(128);
  while (words.length % 64 !== 56) words.push(0);
  const high = Math.floor(bitLength / 4294967296);
  const low = bitLength >>> 0;
  for (let shift = 24; shift >= 0; shift -= 8) words.push(high >>> shift & 255);
  for (let shift = 24; shift >= 0; shift -= 8) words.push(low >>> shift & 255);
  const primes = [];
  for (let candidate = 2; primes.length < 64; candidate += 1) {
    if (primes.every((prime) => candidate % prime !== 0)) primes.push(candidate);
  }
  const h = primes.slice(0, 8).map((prime) => Math.sqrt(prime) * 4294967296 >>> 0);
  const k = primes.map((prime) => Math.cbrt(prime) * 4294967296 >>> 0);
  for (let offset = 0; offset < words.length; offset += 64) {
    const w = new Array(64);
    for (let i = 0; i < 16; i += 1) {
      const byteAt = offset + i * 4;
      w[i] = (at(words, byteAt) << 24 | at(words, byteAt + 1) << 16 | at(words, byteAt + 2) << 8 | at(words, byteAt + 3)) >>> 0;
    }
    for (let i = 16; i < 64; i += 1) {
      const prior15 = at(w, i - 15);
      const prior2 = at(w, i - 2);
      const s0 = rightRotate(prior15, 7) ^ rightRotate(prior15, 18) ^ prior15 >>> 3;
      const s1 = rightRotate(prior2, 17) ^ rightRotate(prior2, 19) ^ prior2 >>> 10;
      w[i] = at(w, i - 16) + s0 + at(w, i - 7) + s1 >>> 0;
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
      const ch = e & f ^ ~e & g;
      const temp1 = hh + s1 + ch + at(k, i) + at(w, i) >>> 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = a & b ^ a & c ^ b & c;
      const temp2 = s0 + maj >>> 0;
      hh = g;
      g = f;
      f = e;
      e = d + temp1 >>> 0;
      d = c;
      c = b;
      b = a;
      a = temp1 + temp2 >>> 0;
    }
    const state = [a, b, c, d, e, f, g, hh];
    for (let i = 0; i < 8; i += 1) h[i] = at(h, i) + at(state, i) >>> 0;
  }
  return h.map((part) => part.toString(16).padStart(8, "0")).join("");
}
function extractRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const o = payload;
    const d = o["d"];
    if (d && Array.isArray(d["results"])) return d["results"];
    for (const key of ["results", "data", "rows", "items", "ITEMS", "ET_DATA"]) {
      if (Array.isArray(o[key])) return o[key];
    }
  }
  return [];
}
function postingDateRange(rows) {
  if (!rows.length) return null;
  const dates = rows.map((row) => row.posting_date);
  if (dates.some((date) => !date)) {
    throw new Error("SAP response contains mapped rows without a valid Posting Date");
  }
  const validDates = dates.filter((date) => Boolean(date)).sort();
  const from = validDates[0];
  const to = validDates[validDates.length - 1];
  if (!from || !to) throw new Error("SAP response does not contain a valid Posting Date range");
  return { from, to };
}
function mapRow(raw, sourceEndpoint, syncedAt) {
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
    mngrp1: str(pickField(raw, ["MNGRP1", "mngrp1"])) || null,
    pcgrp1: str(pickField(raw, ["PCGRP1", "pcgrp1"])) || null,
    pcgrp2: str(pickField(raw, ["PCGRP2", "pcgrp2"])) || null,
    pcgrp3: str(pickField(raw, ["PCGRP3", "pcgrp3"])) || null,
    customer_group: str(pickField(raw, ["KDGRP_DESP", "KDGRP", "customerGroup"])),
    usage_desc: str(pickField(raw, ["ABRVW_DESP", "ABRVW", "usage"])),
    sales_org: str(pickField(raw, ["SALES_ORG_DESP", "VKORG", "salesOrg"])),
    incoterms: str(pickField(raw, ["INCO1", "inco1", "incoterms"])),
    sales_rep: str(pickField(raw, ["LIFNR", "lifnr", "salesRep"])),
    sales_rep_name: str(pickField(raw, ["NAME11", "name11", "salesRepName"])),
    total_ah: num(pickField(raw, ["TOT_AH", "tot_ah"])),
    pc_short_name: str(pickField(raw, ["ABTEI", "abtei", "PC_SHORT", "PRCTR_SHORT", "KTEXT", "pcShortName"])),
    sub_group: str(pickField(raw, ["SUBGRP1", "SUB_GROUP", "SUBGRP", "subGroup", "PCGRP1", "pcgrp1"])),
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
    synced_at: syncedAt
  };
}
function buildSyncScopeKey(sourceEndpoint, requestSnapshot) {
  const request = requestSnapshot && typeof requestSnapshot === "object" && !Array.isArray(requestSnapshot) ? requestSnapshot : {};
  const scope = {
    endpoint: sourceEndpoint,
    systemKey: request["systemKey"] ?? null,
    sapClient: request["sapClient"] ?? null,
    path: request["path"] ?? null,
    query: request["query"] ?? null,
    body: request["body"] ?? null
  };
  return `scope:${sha256(canonicalJson(scope))}`;
}
function snapshotUuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const hex = sha256(`${Date.now()}:${Math.random()}`).slice(0, 32).split("");
  hex[12] = "4";
  hex[16] = (Number.parseInt(hex[16] ?? "0", 16) & 3 | 8).toString(16);
  return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20).join("")}`;
}
function mapPayload(payload, sourceEndpoint, requestSnapshot, suppliedSnapshotId) {
  const syncedAt = (/* @__PURE__ */ new Date()).toISOString();
  const raws = extractRows(payload);
  const rows = [];
  const syncScopeKey = buildSyncScopeKey(sourceEndpoint, requestSnapshot);
  const snapshotId = suppliedSnapshotId ?? snapshotUuid();
  const occurrences = /* @__PURE__ */ new Map();
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
      is_active_snapshot: false
    });
  }
  return {
    received: raws.length,
    rows,
    skipped: invalid,
    invalid,
    duplicates,
    syncScopeKey,
    snapshotId,
    postingRange: postingDateRange(rows)
  };
}

// ../src/lib/open-sales-orders-map.ts
var str2 = (value) => value == null ? "" : String(value).trim();
var num2 = (value) => {
  const s = str2(value).replace(/,/g, "");
  const n = Number(s.endsWith("-") ? `-${s.slice(0, -1)}` : s);
  return s && Number.isFinite(n) ? n : 0;
};
var pick = (row, keys) => {
  for (const key of keys) if (row[key] != null && str2(row[key])) return row[key];
  return "";
};
var snapshotUuid2 = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const hex = sha256(`${Date.now()}:${Math.random()}`).slice(0, 32).split("");
  hex[12] = "4";
  hex[16] = (Number.parseInt(hex[16] ?? "0", 16) & 3 | 8).toString(16);
  return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20).join("")}`;
};
function mapOpenSalesOrderRow(raw, sourceEndpoint, syncedAt) {
  const salesOrder = str2(pick(raw, ["VBELN", "vbeln", "salesOrder"]));
  const salesOrderItem = str2(pick(raw, ["POSNR", "posnr", "salesOrderItem"]));
  if (!salesOrder || !salesOrderItem) return null;
  const rowHash = `sha256:${sha256(canonicalJson(raw))}`;
  const quantity = num2(pick(raw, ["KWMENG", "KWMENG_C", "quantity"]));
  const openQuantity = pick(raw, ["KWMENG_P", "KWMENG_PC", "OPEN_QTY", "openQuantity"]);
  const normalizedOpenQuantity = openQuantity === "" ? quantity : num2(openQuantity);
  const deliveredQuantity = pick(raw, ["RFMNG", "DELIVERED_QTY", "deliveredQuantity"]);
  const kwertInr = num2(pick(raw, ["KWERT_INR", "kwert_inr"]));
  const bValue = num2(pick(raw, ["B_VALUE", "b_value"]));
  const pValue1 = num2(pick(raw, ["P_VALUE1", "p_value1"]));
  const ldStatus = pick(raw, ["LD_STATUS", "LD_Status", "ld_status"]);
  return {
    record_key: rowHash,
    sync_scope_key: `endpoint:${sourceEndpoint}`,
    snapshot_id: "00000000-0000-4000-8000-000000000000",
    row_hash: rowHash,
    occurrence_no: 1,
    is_active_snapshot: false,
    sales_order: salesOrder,
    sales_order_item: salesOrderItem,
    preceding_document: str2(pick(raw, ["VGBEL", "VBELN_P"])),
    purchase_order: str2(pick(raw, ["BSTNK", "bstnk"])),
    order_type: str2(pick(raw, ["AUART", "auart"])),
    order_date: toIsoDate(pick(raw, ["ERDAT", "erdat"])),
    purchase_order_date: toIsoDate(pick(raw, ["BSTDK", "bstdk"])),
    delivery_date: toIsoDate(pick(raw, ["DELV_DAT", "VDATU"])),
    distribution_channel: str2(pick(raw, ["S_VTWEG", "s_vtweg", "VTWEG", "vtweg"])),
    division: str2(pick(raw, ["DIVISION", "division"])),
    plant: str2(pick(raw, ["WERKS", "werks"])),
    plant_name: str2(pick(raw, ["WERKS_NAME", "werksName"])),
    sales_office: str2(pick(raw, ["VKBUR", "vkbur"])),
    sales_group: str2(pick(raw, ["VKGRP", "vkgrp"])),
    profit_center: str2(pick(raw, ["PRCTR", "prctr"])),
    profit_center_name: str2(pick(raw, ["PRCTR_NAME", "prctr_name"])),
    main_group: str2(pick(raw, ["MNGRP1", "mngrp1"])),
    sub_group: str2(pick(raw, ["PCGRP1", "pcgrp1"])),
    mngrp1: str2(pick(raw, ["MNGRP1"])) || null,
    pcgrp1: str2(pick(raw, ["PCGRP1"])) || null,
    pcgrp2: str2(pick(raw, ["PCGRP2"])) || null,
    pcgrp3: str2(pick(raw, ["PCGRP3"])) || null,
    sales_rep_name: str2(pick(raw, ["NAME1_SE", "salesRepName"])),
    customer_sold_to: str2(pick(raw, ["KUNNR_SP", "KUNNR"])),
    customer_sold_to_name: str2(pick(raw, ["NAME1_SP", "NAME1"])),
    customer_bill_to: str2(pick(raw, ["KUNNR_BP"])),
    customer_bill_to_name: str2(pick(raw, ["NAME1_BP"])),
    customer_ship_to: str2(pick(raw, ["KUNNR_SH"])),
    customer_ship_to_name: str2(pick(raw, ["NAME1_SH"])),
    material: str2(pick(raw, ["MATNR", "matnr"])),
    material_description: str2(pick(raw, ["MAKTX", "maktx"])),
    material_type: str2(pick(raw, ["MTART", "mtart"])),
    product_category: str2(pick(raw, ["BEZEI1"])),
    model: str2(pick(raw, ["MODEL", "model"])),
    product_range: str2(pick(raw, ["RANGE", "range"])),
    product_type: str2(pick(raw, ["TYPE", "type"])),
    region: str2(pick(raw, ["BEZEI_SP", "REGION", "BEZEI"])),
    sales_zone: str2(pick(raw, ["BEZEI", "SALES_ZONE", "ZONE"])),
    country: str2(pick(raw, ["LANDX_SP", "LANDX_BP"])),
    sales_type: str2(pick(raw, ["VTEXT_DC", "vtext_dc", "SALE"])),
    industry_description: str2(pick(raw, ["VTEXT_DI"])),
    customer_group: str2(pick(raw, ["KDGRP_DESP", "KDGRP"])),
    usage_description: str2(pick(raw, ["ABRVW_DESP", "ABRVW"])),
    ah: num2(pick(raw, ["AH", "ah"])),
    total_ah: num2(pick(raw, ["TOT_AH", "tot_ah"])),
    quantity,
    open_quantity: normalizedOpenQuantity,
    delivered_quantity: deliveredQuantity === "" ? Math.max(0, quantity - normalizedOpenQuantity) : num2(deliveredQuantity),
    unit: str2(pick(raw, ["VRKME", "MEINS"])),
    currency: str2(pick(raw, ["WAERK"])),
    kwert_inr: kwertInr,
    b_value: bValue,
    p_value1: pValue1,
    ld_status: ldStatus === "" ? null : String(ldStatus),
    open_value: pValue1,
    days_open: Math.round(num2(pick(raw, ["DAYS"]))),
    delivery_status: str2(pick(raw, ["ABSTA"])),
    overall_status: str2(pick(raw, ["GBSTA"])),
    raw,
    source_endpoint: sourceEndpoint,
    synced_at: syncedAt
  };
}
function mapOpenSalesOrdersPayload(payload, sourceEndpoint, requestSnapshot) {
  const syncedAt = (/* @__PURE__ */ new Date()).toISOString(), raws = extractRows(payload), syncScopeKey = buildSyncScopeKey(sourceEndpoint, requestSnapshot), snapshotId = snapshotUuid2(), businessKeys = /* @__PURE__ */ new Set();
  let invalid = 0, duplicates = 0;
  const rows = raws.flatMap((raw) => {
    const mapped = mapOpenSalesOrderRow(raw, sourceEndpoint, syncedAt);
    if (!mapped) {
      invalid += 1;
      return [];
    }
    const businessKey = `${mapped.sales_order}\0${mapped.sales_order_item}`;
    if (businessKeys.has(businessKey)) {
      duplicates += 1;
      return [];
    }
    businessKeys.add(businessKey);
    return [{ ...mapped, record_key: `snapshot:${sha256(`${syncScopeKey}:${snapshotId}:${businessKey}`)}`, sync_scope_key: syncScopeKey, snapshot_id: snapshotId, occurrence_no: 1 }];
  });
  if (invalid) throw new Error(`Open Sales Orders response contains ${invalid} row(s) without VBELN + POSNR`);
  if (duplicates) throw new Error(`Open Sales Orders response contains ${duplicates} duplicate VBELN + POSNR key(s)`);
  return { received: raws.length, rows, skipped: 0, invalid: 0, duplicates: 0, syncScopeKey, snapshotId };
}

// ../src/lib/zcash-flow-map.ts
function isZcashFlowEndpoint(endpointName) {
  const n = endpointName.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return n === "zcashflow" || n === "zcashflown";
}
function pick2(raw, keys) {
  for (const k of keys) if (raw[k] !== void 0 && raw[k] !== null) return raw[k];
  const lower = new Map(Object.keys(raw).map((k) => [k.toLowerCase(), k]));
  for (const k of keys) {
    const real = lower.get(k.toLowerCase());
    if (real && raw[real] !== void 0 && raw[real] !== null) return raw[real];
  }
  return void 0;
}
function text(v) {
  if (v === void 0 || v === null) return null;
  const s = String(v).trim();
  return s ? s : null;
}
function cashNum(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (v === void 0 || v === null) return 0;
  let s = String(v).trim().replace(/,/g, "");
  if (!s) return 0;
  if (s.endsWith("-")) s = "-" + s.slice(0, -1);
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}
function plantOf(raw) {
  const p = pick2(raw, ["PLANT"]);
  if (p && typeof p === "object" && !Array.isArray(p)) {
    return text(pick2(p, ["WERKS"])) ?? "";
  }
  return text(p) ?? text(pick2(raw, ["WERKS"])) ?? "";
}
function extractCashRows(payload) {
  if (Array.isArray(payload)) return payload.filter((r) => r && typeof r === "object");
  if (payload && typeof payload === "object") {
    const obj = payload;
    if (obj["ERROR_CODE"] !== void 0 || obj["MESSAGE"] !== void 0 && !Array.isArray(obj["data"])) {
      return [];
    }
    for (const key of ["data", "DATA", "results", "items", "value"]) {
      if (Array.isArray(obj[key])) return extractCashRows(obj[key]);
    }
  }
  return [];
}
function mapZcashFlowPayload(payload, endpointName, now = /* @__PURE__ */ new Date()) {
  const source = extractCashRows(payload);
  const syncedAt = now.toISOString();
  const byKey = /* @__PURE__ */ new Map();
  let invalid = 0;
  for (const raw of source) {
    const profit_center = text(pick2(raw, ["PROFIT_CENTER"])) ?? "";
    const gl_code = text(pick2(raw, ["GL_CODE"])) ?? "";
    const plant = plantOf(raw);
    if (!profit_center && !gl_code) {
      invalid++;
      continue;
    }
    byKey.set(`${profit_center}|${plant}|${gl_code}`, {
      profit_center,
      plant,
      gl_code,
      profit_center_name: text(pick2(raw, ["PROFIT_CENTER_NAME"])),
      group_name: text(pick2(raw, ["GROUP_NAME"])),
      gl_name: text(pick2(raw, ["GL_NAME"])),
      classification: text(pick2(raw, ["CLASSIFICATION"])),
      nature: text(pick2(raw, ["NATURE"])),
      profit_center_group: text(pick2(raw, ["PROFIT_CENTER_GROUP"])),
      debit: cashNum(pick2(raw, ["DEBIT"])),
      credit: cashNum(pick2(raw, ["CREDIT"])),
      net: cashNum(pick2(raw, ["NET"])),
      collection_disbursement: text(pick2(raw, ["COLLECTION_DISBURSEMENT"])),
      raw,
      source_endpoint: endpointName,
      synced_at: syncedAt
    });
  }
  const rows = [...byKey.values()];
  return { received: source.length, rows, invalid, duplicates: source.length - invalid - rows.length };
}

// ../src/lib/order-book-map.ts
var RENAMED = {
  VBELN: "sales_order",
  POSNR: "sales_order_item",
  WERKS: "plant",
  PC_CODE: "profit_center",
  ERDAT: "created_date"
};
var ORDER_BOOK_TEXT_FIELDS = [
  "APPTYP",
  "SECTOR",
  "VTWEG",
  "SPART",
  "WERKS",
  "VBELN",
  "AUART",
  "KUNNR_SP",
  "NAME1_SP",
  "KUNNR_BP",
  "NAME1_BP",
  "KUNNR_SH",
  "NAME1_SH",
  "BSTNK",
  "POSNR",
  "MATNR",
  "MAKTX",
  "VRKME",
  "WAERK",
  "ZTERM",
  "PAY_VTEXT",
  "DELV_DAT",
  "WARTY",
  "INCO1",
  "LD_TERMS",
  "VKBUR",
  "NAME1_SE",
  "VTEXT_DC",
  "VTEXT_DI",
  "INCO2",
  "MEINS",
  "BEZEI",
  "LANDX_SP",
  "BEZEI_SP",
  "LANDX_BP",
  "BEZEI_BP",
  "LANDX_SH",
  "BEZEI_SH",
  "VGBEL",
  "PROJ",
  "VKGRP",
  "YEAR",
  "ABSTA",
  "GBSTA",
  "BUY_BACK",
  "BUY_BACK_DETAIL",
  "UNLOAD",
  "LD_STATUS",
  "MODEL",
  "RANGE",
  "TYPE",
  "PLANT_NAME",
  "DIV_NAME",
  "PC_CODE",
  "PC_NAME",
  "MAIN_GRP",
  "SUB_GRP",
  "MNGRP1",
  "PCGRP1",
  "PCGRP2",
  "PCGRP3"
];
var ORDER_BOOK_NUMERIC_FIELDS = [
  "KWMENG",
  "KWMENG_P",
  "STCUR",
  "KBETR",
  "KWMENG_C",
  "KWMENG_PC",
  "P_VALUE",
  "KWERT_BA",
  "KWERT_BC",
  "KWERT_BCI",
  "KWERT_DS",
  "KWERT_ED",
  "KWERT_CST",
  "KWERT_VAT",
  "KWERT_ST",
  "KWERT_SW",
  "KWERT_GST",
  "KWERT_KKC",
  "KWERT_VSC",
  "NETWR",
  "KWERT_FR",
  "ZNRC",
  "ZCOM",
  "ZPF1",
  "ZTAX",
  "ZDST",
  "KF00",
  "ZF01",
  "ZF02",
  "KURSK",
  "TOT_INR",
  "NET_INR",
  "UMREN",
  "TOT_AH",
  "BASIC_AH",
  "BASIC_AHINR",
  "UMVKZ",
  "TWAR",
  "KWERT_ZSBP",
  "KWERT_ZSF1",
  "KWERT_ZSF2"
];
var ORDER_BOOK_DATE_FIELDS = ["ERDAT", "BSTDK"];
var orderBookColumn = (sapKey) => RENAMED[sapKey] ?? sapKey.toLowerCase();
function isOrderBookEndpoint(endpointName) {
  return endpointName.replace(/[^a-z0-9]/gi, "").toLowerCase().includes("orderbook");
}
function pick3(raw, key) {
  if (raw[key] !== void 0) return raw[key];
  const real = Object.keys(raw).find((k) => k.toLowerCase() === key.toLowerCase());
  return real ? raw[real] : void 0;
}
function text2(v) {
  if (v === void 0 || v === null) return null;
  const s = String(v).trim();
  return s ? s : null;
}
function orderBookNum(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (v === void 0 || v === null) return 0;
  let s = String(v).trim().replace(/,/g, "");
  if (!s) return 0;
  if (s.endsWith("-")) s = "-" + s.slice(0, -1);
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}
function orderBookDate(v) {
  const s = text2(v);
  if (!s || /^0+$/.test(s.replace(/\D/g, ""))) return null;
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}
function extractRows2(payload) {
  if (Array.isArray(payload)) return payload.filter((r) => r && typeof r === "object");
  if (payload && typeof payload === "object") {
    const obj = payload;
    for (const key of ["data", "DATA", "results", "items", "value"]) {
      if (Array.isArray(obj[key])) return extractRows2(obj[key]);
    }
  }
  return [];
}
function mapOrderBookPayload(payload, endpointName, now = /* @__PURE__ */ new Date()) {
  const source = extractRows2(payload);
  const syncedAt = now.toISOString();
  const byKey = /* @__PURE__ */ new Map();
  let invalid = 0;
  for (const raw of source) {
    const vbeln = text2(pick3(raw, "VBELN"));
    const posnr = text2(pick3(raw, "POSNR"));
    if (!vbeln || !posnr) {
      invalid++;
      continue;
    }
    const row = { sales_order: vbeln, sales_order_item: posnr, raw, source_endpoint: endpointName, synced_at: syncedAt };
    for (const k of ORDER_BOOK_TEXT_FIELDS) if (k !== "VBELN" && k !== "POSNR") row[orderBookColumn(k)] = text2(pick3(raw, k));
    for (const k of ORDER_BOOK_NUMERIC_FIELDS) row[orderBookColumn(k)] = orderBookNum(pick3(raw, k));
    for (const k of ORDER_BOOK_DATE_FIELDS) row[orderBookColumn(k)] = orderBookDate(pick3(raw, k));
    byKey.set(`${vbeln}|${posnr}`, row);
  }
  const rows = [...byKey.values()];
  return { received: source.length, rows, invalid, duplicates: source.length - invalid - rows.length };
}

// ../src/lib/sit-map.ts
var SIT_TEXT_FIELDS = ["APPTYP", "SECTOR", "WERKS", "NAME1_P", "EXGRP", "VTWEG_AUFT", "MATKL", "VTEXT_DC", "SPART", "VTEXT_SD", "PRCTR", "PRCTR_I", "MCTXT", "MCTXT_I", "KUNAG", "NAME_C", "GSTIN_C", "LANDX50_C", "BEZEI_C", "J_1ICSTNO_C", "KUNNR", "NAME_P", "GSTIN_PY", "KUNNR_S", "NAME_S", "GSTIN_SH", "LANDX50_S", "BEZEI_S", "J_1ICSTNO_S", "KUNNR_RE", "NAME_RE", "GSTIN_RE", "FKART", "VTEXT", "AUBEL", "BSTNK", "MATNR", "HSN_CODE", "ARKTX", "XBLNR", "LIFNR", "VTXT_C", "VTXT_V", "WAERK", "RFBSK", "BEZEI_SO", "BEZEI_SG", "SEGMENT", "ZTERM", "VTEXT_PAY", "NAME_SE", "NAME_TF", "LR_NO", "PREPRN", "EXNUM", "FAWREF", "HKONT", "TXT50", "REMARKS_F2", "NOTI_TEXT", "EX_COM_TEXT", "INCO1", "INCO2", "J_1ICHID", "VBELN_DEL", "MEINS", "VRKME", "MTART", "LAND1", "REGIO", "BUKRS", "KUNNR_SP", "KUNNR_SH", "KUNNR_BP", "BRSCH", "BRTXT", "DIVISION", "INV", "REF", "BELNR1", "BELNR2", "JV3", "JV4", "AUART", "RACCT", "MBLNR", "BELNR3", "TXT500", "AGE", "VBELN_C", "VGBEL", "LGORT", "LGOBE", "DIV_NAME", "MAIN_GRP", "SUB_GRP", "MNGRP1", "PCGRP1", "PCGRP2", "PCGRP3", "AUPOS", "GJAHR1", "GJAHR2", "MJAHR", "CELLCOLOR"];
var SIT_NUMERIC_FIELDS = ["FKIMG", "KBETR", "NETWR", "NETWR_B", "NETWR_BEX", "NETWR_TOT", "KWERT_D", "KWERT_DEX", "CST", "CST_EX", "TOT_BP", "PRICE_CELL", "PRICE_CELLINR", "VAT", "VAT_EX", "TCS", "TCS_EX", "MWSBK", "MWSBK_EX", "NETWR_T", "NETWR_T_EX", "NETWR_EX", "TAX_RATE", "KWERT_CGST", "KWERT_SGST", "KWERT_IGST", "KURRF", "FRGHT1", "FRGHT1_EX", "FRGHT2", "FRGHT2_EX", "DISCNT", "DISCNT_EX", "KWERT_ZNRC", "KWERT_ZNRC_INR", "SBCESS", "SBCESS_EX", "PFCHRG", "PFCHRG_EX", "SERVI", "SERVI_EX", "ECESS", "ECESS_EX", "SHESS", "SHESS_EX", "JLSR", "JLSR_EX", "ZGST", "ZGST_EX", "ZKKC", "ZKKC_EX", "UMREN", "TOT_AH", "AH", "KWMENG", "UMVKZ", "FKIMG_TOT", "BASIC_AH", "BASIC_AHINR", "DMBTR"];
var SIT_DATE_FIELDS = ["ERDAT", "FKDAT", "BSTDK", "FKDAT_BILL", "EXDAT", "AUDAT", "LFDAT_DEL", "BUDAT", "PODDATE", "FKDAT_C"];
function isSitEndpoint(name) {
  const n = (name ?? "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  return n.includes("salesintransit") || n === "sit" || n === "zsit" || /(^|[^a-z])z?_?sit([^a-z]|$)/i.test(name ?? "");
}
function pick4(raw, key) {
  if (raw[key] !== void 0) return raw[key];
  const real = Object.keys(raw).find((k) => k.toLowerCase() === key.toLowerCase());
  return real ? raw[real] : void 0;
}
function text3(v) {
  if (v === void 0 || v === null) return null;
  if (typeof v === "object") {
    const s2 = JSON.stringify(v);
    return s2 === "[]" || s2 === "{}" ? null : s2;
  }
  const s = String(v).trim();
  return s ? s : null;
}
function extractRows3(payload) {
  if (Array.isArray(payload)) return payload.filter((r) => r && typeof r === "object");
  if (payload && typeof payload === "object") {
    const obj = payload;
    for (const key of ["data", "DATA", "results", "items", "value"]) if (Array.isArray(obj[key])) return extractRows3(obj[key]);
  }
  return [];
}
function mapSitPayload(payload, endpointName, now = /* @__PURE__ */ new Date()) {
  const source = extractRows3(payload);
  const syncedAt = now.toISOString();
  const byKey = /* @__PURE__ */ new Map();
  let invalid = 0;
  for (const raw of source) {
    const vbeln = text3(pick4(raw, "VBELN"));
    const posnr = text3(pick4(raw, "POSNR"));
    if (!vbeln || !posnr) {
      invalid++;
      continue;
    }
    const row = { vbeln, posnr, raw, source_endpoint: endpointName, synced_at: syncedAt };
    for (const k of SIT_TEXT_FIELDS) row[k.toLowerCase()] = text3(pick4(raw, k));
    for (const k of SIT_NUMERIC_FIELDS) row[k.toLowerCase()] = orderBookNum(pick4(raw, k));
    for (const k of SIT_DATE_FIELDS) row[k.toLowerCase()] = orderBookDate(pick4(raw, k));
    byKey.set(`${vbeln}|${posnr}`, row);
  }
  const rows = [...byKey.values()];
  return { received: source.length, rows, invalid, duplicates: source.length - invalid - rows.length };
}

// ../src/lib/sales-register-map.ts
var SALES_REGISTER_TEXT_FIELDS = ["APPTYP", "SECTOR", "WERKS", "NAME1_P", "EXGRP", "VTWEG_AUFT", "MATKL", "VTEXT_DC", "SPART", "VTEXT_SD", "PRCTR", "PRCTR_I", "MCTXT", "MCTXT_I", "KUNAG", "NAME_C", "GSTIN_C", "LANDX50_C", "BEZEI_C", "J_1ICSTNO_C", "KUNNR", "NAME_P", "GSTIN_PY", "KUNNR_S", "NAME_S", "GSTIN_SH", "LANDX50_S", "BEZEI_S", "J_1ICSTNO_S", "KUNNR_RE", "NAME_RE", "GSTIN_RE", "FKART", "VTEXT", "AUBEL", "BSTNK", "MATNR", "HSN_CODE", "ARKTX", "XBLNR", "LIFNR", "VTXT_C", "VTXT_V", "WAERK", "RFBSK", "BEZEI_SO", "BEZEI_SG", "SEGMENT", "ZTERM", "VTEXT_PAY", "NAME_SE", "NAME_TF", "LR_NO", "PREPRN", "EXNUM", "FAWREF", "HKONT", "TXT50", "REMARKS_F2", "NOTI_TEXT", "EX_COM_TEXT", "INCO1", "INCO2", "J_1ICHID", "VBELN_DEL", "MEINS", "VRKME", "MTART", "LAND1", "REGIO", "BUKRS", "KUNNR_SP", "KUNNR_SH", "KUNNR_BP", "BRSCH", "BRTXT", "DIVISION", "INV", "REF", "BELNR1", "BELNR2", "JV3", "JV4", "AUART", "RACCT", "MBLNR", "BELNR3", "TXT500", "AGE", "VBELN_C", "VGBEL", "LGORT", "LGOBE", "DIV_NAME", "MAIN_GRP", "SUB_GRP", "MNGRP1", "PCGRP1", "PCGRP2", "PCGRP3", "AUPOS", "GJAHR1", "GJAHR2", "MJAHR", "CELLCOLOR", "ABRVW", "ABRVW_DESP", "BATTERY_SERIAL_NO", "GST_TDS", "KDGRP", "KDGRP_DESP", "MAIN_GROUP", "MODEL", "SUB_GROUP", "TYPE", "VTEXT_DESP", "WRDETS", "WRMNTS"];
var SALES_REGISTER_NUMERIC_FIELDS = ["FKIMG", "KBETR", "NETWR", "NETWR_B", "NETWR_BEX", "NETWR_TOT", "KWERT_D", "KWERT_DEX", "CST", "CST_EX", "TOT_BP", "PRICE_CELL", "PRICE_CELLINR", "VAT", "VAT_EX", "TCS", "TCS_EX", "MWSBK", "MWSBK_EX", "NETWR_T", "NETWR_T_EX", "NETWR_EX", "TAX_RATE", "KWERT_CGST", "KWERT_SGST", "KWERT_IGST", "KURRF", "FRGHT1", "FRGHT1_EX", "FRGHT2", "FRGHT2_EX", "DISCNT", "DISCNT_EX", "KWERT_ZNRC", "KWERT_ZNRC_INR", "SBCESS", "SBCESS_EX", "PFCHRG", "PFCHRG_EX", "SERVI", "SERVI_EX", "ECESS", "ECESS_EX", "SHESS", "SHESS_EX", "JLSR", "JLSR_EX", "ZGST", "ZGST_EX", "ZKKC", "ZKKC_EX", "UMREN", "TOT_AH", "AH", "KWMENG", "UMVKZ", "FKIMG_TOT", "BASIC_AH", "BASIC_AHINR", "DMBTR", "MATERIAL_COST", "OVERHEAD_COST", "TOTAL_COST", "ZAH", "TWAR"];
var SALES_REGISTER_DATE_FIELDS = ["ERDAT", "FKDAT", "BSTDK", "FKDAT_BILL", "EXDAT", "AUDAT", "LFDAT_DEL", "BUDAT", "PODDATE", "FKDAT_C", "ZWREXPDT"];
function isSalesRegisterEndpoint(name) {
  return (name ?? "").replace(/[^a-z0-9]/gi, "").toLowerCase().includes("salesregister");
}
function pick5(raw, key) {
  if (raw[key] !== void 0) return raw[key];
  const real = Object.keys(raw).find((k) => k.toLowerCase() === key.toLowerCase());
  return real ? raw[real] : void 0;
}
function text4(v) {
  if (v === void 0 || v === null) return null;
  if (typeof v === "object") {
    const s2 = JSON.stringify(v);
    return s2 === "[]" || s2 === "{}" ? null : s2;
  }
  const s = String(v).trim();
  return s ? s : null;
}
function extractRows4(payload) {
  if (Array.isArray(payload)) return payload.filter((r) => r && typeof r === "object");
  if (payload && typeof payload === "object") {
    const obj = payload;
    for (const key of ["data", "DATA", "results", "items", "value"]) if (Array.isArray(obj[key])) return extractRows4(obj[key]);
  }
  return [];
}
function mapSalesRegisterPayload(payload, endpointName, now = /* @__PURE__ */ new Date()) {
  const source = extractRows4(payload);
  const syncedAt = now.toISOString();
  const byKey = /* @__PURE__ */ new Map();
  let invalid = 0;
  for (const raw of source) {
    const vbeln = text4(pick5(raw, "VBELN"));
    const posnr = text4(pick5(raw, "POSNR"));
    if (!vbeln || !posnr) {
      invalid++;
      continue;
    }
    const row = { vbeln, posnr, raw, source_endpoint: endpointName, synced_at: syncedAt };
    for (const k of SALES_REGISTER_TEXT_FIELDS) row[k.toLowerCase()] = text4(pick5(raw, k));
    for (const k of SALES_REGISTER_NUMERIC_FIELDS) row[k.toLowerCase()] = orderBookNum(pick5(raw, k));
    for (const k of SALES_REGISTER_DATE_FIELDS) row[k.toLowerCase()] = orderBookDate(pick5(raw, k));
    byKey.set(`${vbeln}|${posnr}`, row);
  }
  const rows = [...byKey.values()];
  return { received: source.length, rows, invalid, duplicates: source.length - invalid - rows.length };
}

// ../src/lib/user-dropdown-map.ts
function isUserDropdownEndpoint(endpointName) {
  return endpointName.replace(/[^a-z0-9]/gi, "").toLowerCase().includes("usermanagementdropdown");
}
function text5(v) {
  if (v === void 0 || v === null) return null;
  const s = String(v).trim();
  return s ? s : null;
}
function field(raw, key) {
  if (raw[key] !== void 0) return raw[key];
  const real = Object.keys(raw).find((k) => k.toLowerCase() === key.toLowerCase());
  return real ? raw[real] : void 0;
}
function list(obj, key) {
  const v = field(obj, key);
  return Array.isArray(v) ? v.filter((r) => r && typeof r === "object") : [];
}
function mapUserDropdownPayload(payload, endpointName, now = /* @__PURE__ */ new Date()) {
  let root = {};
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    root = payload;
    const inner = field(root, "data");
    if (inner && typeof inner === "object" && !Array.isArray(inner)) root = inner;
  }
  const syncedAt = now.toISOString();
  const byKey = /* @__PURE__ */ new Map();
  let received = 0;
  let invalid = 0;
  const add = (category, rows2, codeKey, nameKey) => {
    for (const raw of rows2) {
      received++;
      const code = text5(field(raw, codeKey));
      if (!code) {
        invalid++;
        continue;
      }
      byKey.set(`${category}|${code}`, {
        category,
        code,
        name: text5(field(raw, nameKey)),
        raw,
        source_endpoint: endpointName,
        synced_at: syncedAt
      });
    }
  };
  add("plant", list(root, "plants"), "plant", "plantName");
  add("profit_center", list(root, "profitCenters"), "profitCenter", "profitCenterName");
  const rows = [...byKey.values()];
  return { received, rows, invalid, duplicates: received - invalid - rows.length };
}

// ../src/lib/payload-fields.ts
function stripJsonComments(raw) {
  return (raw ?? "").split(/\r?\n/).filter((line) => !line.trim().startsWith("//")).join("\n").replace(/,(\s*[}\]])/g, "$1");
}

// ../src/lib/sap-pull-shared.ts
function salvageTruncatedArray(text6) {
  const trimmed = text6.trimStart();
  if (!trimmed.startsWith("[")) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  let lastComplete = -1;
  for (let i = 0; i < trimmed.length; i += 1) {
    const ch = trimmed[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      if (inString) escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{" || ch === "[") depth += 1;
    else if (ch === "}" || ch === "]") {
      depth -= 1;
      if (depth === 1) lastComplete = i;
    }
  }
  if (lastComplete < 0) return null;
  try {
    const rows = JSON.parse(`${trimmed.slice(0, lastComplete + 1)}]`);
    return Array.isArray(rows) && rows.length ? rows : null;
  } catch {
    return null;
  }
}
function extractEmbeddedBody(text6) {
  const marker = '"body":"';
  const start = text6.indexOf(marker);
  if (start < 0) return null;
  const raw = text6.slice(start + marker.length);
  try {
    const safe = raw.replace(/\\$/, "");
    return JSON.parse(`"${safe.replace(/"$/, "")}"`);
  } catch {
    return raw.replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\t/g, "	").replace(/\\\\/g, "\\");
  }
}
var sapDateOf = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
function postingWindow(range, now = /* @__PURE__ */ new Date()) {
  const to = new Date(now);
  const from = new Date(now);
  switch (range) {
    case "today":
      break;
    case "yesterday":
      from.setDate(from.getDate() - 1);
      to.setDate(to.getDate() - 1);
      break;
    case "last7d":
      from.setDate(from.getDate() - 7);
      break;
    case "last1m":
      from.setMonth(from.getMonth() - 1);
      break;
    case "last6m":
      from.setMonth(from.getMonth() - 6);
      break;
    case "last1y":
      from.setFullYear(from.getFullYear() - 1);
      break;
    case "fytd": {
      const y = to.getMonth() >= 3 ? to.getFullYear() : to.getFullYear() - 1;
      from.setFullYear(y, 3, 1);
      break;
    }
    default:
      return null;
  }
  return { from: sapDateOf(from), to: sapDateOf(to) };
}
function withPostingDates(raw, range) {
  if (!raw || !raw.trim()) return raw ?? void 0;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return raw;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return raw;
  const obj = parsed;
  const window = postingWindow(range);
  if (window) {
    if ("BUDAT_F" in obj) obj["BUDAT_F"] = window.from;
    if ("BUDAT_T" in obj) obj["BUDAT_T"] = window.to;
    return JSON.stringify(obj);
  }
  const sapDate = (daysAgo) => {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() - daysAgo);
    return sapDateOf(d);
  };
  const valid = (v) => /^\d{8}$/.test(String(v ?? "").trim());
  if ("BUDAT_F" in obj && !valid(obj["BUDAT_F"])) obj["BUDAT_F"] = sapDate(7);
  if ("BUDAT_T" in obj && !valid(obj["BUDAT_T"])) obj["BUDAT_T"] = sapDate(0);
  return JSON.stringify(obj);
}
function withOpenSalesOrdersDate(raw, now = /* @__PURE__ */ new Date(), useCurrentDate = false) {
  if (!raw || !raw.trim()) return raw ?? void 0;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return raw;
    const obj = parsed;
    const savedDate = String(obj["fkdat"] ?? "").trim();
    return JSON.stringify({
      ...obj,
      fkdat: useCurrentDate || !/^\d{8}$/.test(savedDate) ? sapDateOf(now) : savedDate
    });
  } catch {
    return raw;
  }
}
function isOpenSalesOrdersEndpoint(endpointName) {
  return endpointName.replace(/[^a-z0-9]/gi, "").toLowerCase() === "opensalesorders";
}
function withOrderBookDates(raw, range, now = /* @__PURE__ */ new Date()) {
  if (!raw || !raw.trim()) return raw ?? void 0;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return raw;
    const obj = { ...parsed };
    const window = postingWindow(range, now);
    const valid = (v) => /^\d{8}$/.test(String(v ?? "").trim());
    if (window) {
      obj["ERDAT_F"] = window.from;
      obj["ERDAT_T"] = window.to;
    } else {
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      if (!valid(obj["ERDAT_F"])) obj["ERDAT_F"] = sapDateOf(from);
      if (!valid(obj["ERDAT_T"])) obj["ERDAT_T"] = sapDateOf(now);
    }
    return JSON.stringify(obj);
  } catch {
    return raw;
  }
}
function withSitDates(raw, range, now = /* @__PURE__ */ new Date(), scheduled = false) {
  if (!raw || !raw.trim()) return raw ?? void 0;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return raw;
    const obj = { ...parsed };
    const window = postingWindow(range, now);
    if (window) {
      obj["FKDAT_F"] = window.from;
      obj["FKDAT_T"] = range === "today" ? "" : window.to;
    }
    const from = String(obj["FKDAT_F"] ?? "").trim();
    if (scheduled || !/^\d{8}$/.test(from)) obj["FKDAT_F"] = sapDateOf(now);
    if (!String(obj["FKDAT_T"] ?? "").trim()) delete obj["FKDAT_T"];
    return JSON.stringify(obj);
  } catch {
    return raw;
  }
}
function withSalesRegisterMode(raw, scheduled = false, range, now = /* @__PURE__ */ new Date()) {
  try {
    const parsed = raw && raw.trim() ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return raw ?? void 0;
    const obj = {};
    for (const [k, v] of Object.entries(parsed)) if (k.toLowerCase() !== "mode") obj[k] = v;
    const window = postingWindow(range, now);
    if (window) for (const k of Object.keys(obj)) {
      if (/^fkdat_f$/i.test(k)) obj[k] = window.from;
      else if (/^fkdat_t$/i.test(k)) obj[k] = window.to;
    }
    obj["MODE"] = scheduled ? "DAILY" : "ONETIME";
    return JSON.stringify(obj);
  } catch {
    return raw ?? void 0;
  }
}
function withEndpointDates(endpointName, raw, range, now = /* @__PURE__ */ new Date(), scheduled = false) {
  if (raw && /^\s*\/\//m.test(raw)) raw = stripJsonComments(raw);
  if (isSitEndpoint(endpointName)) return withSitDates(raw, range, now, scheduled);
  if (endpointName.replace(/[^a-z0-9]/gi, "").toLowerCase().includes("salesregister")) return withSalesRegisterMode(raw, scheduled, range, now);
  if (/^zcashflown?$/.test(endpointName.replace(/[^a-z0-9]/gi, "").toLowerCase())) return raw ?? void 0;
  if (endpointName.replace(/[^a-z0-9]/gi, "").toLowerCase().includes("usermanagementdropdown")) return raw ?? void 0;
  if (endpointName.replace(/[^a-z0-9]/gi, "").toLowerCase().includes("orderbook")) return withOrderBookDates(raw, range, now);
  return isOpenSalesOrdersEndpoint(endpointName) ? withOpenSalesOrdersDate(raw, now, scheduled) : withPostingDates(raw, range);
}
function keyValueObject(raw) {
  return Array.isArray(raw) ? Object.fromEntries(
    raw.filter((r) => r && typeof r === "object" && String(r.key ?? "").trim()).map((r) => [String(r.key), String(r.value ?? "")])
  ) : {};
}
function formatBytes(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}
var IS_STATIC_BUILD = define_import_meta_env_default["VITE_STATIC_BUILD"] === "1";
export {
  canonicalJson,
  extractEmbeddedBody,
  extractRows,
  formatBytes,
  isOpenSalesOrdersEndpoint,
  isOrderBookEndpoint,
  isSalesRegisterEndpoint,
  isSitEndpoint,
  isUserDropdownEndpoint,
  isZcashFlowEndpoint,
  keyValueObject,
  mapOpenSalesOrderRow,
  mapOpenSalesOrdersPayload,
  mapOrderBookPayload,
  mapPayload,
  mapRow,
  mapSalesRegisterPayload,
  mapSitPayload,
  mapUserDropdownPayload,
  mapZcashFlowPayload,
  postingDateRange,
  salvageTruncatedArray,
  sha256,
  toIsoDate,
  withEndpointDates,
  withPostingDates
};
