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
function mapRow(raw, sourceEndpoint, syncedAt) {
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
function mapPayload(payload, sourceEndpoint) {
  const syncedAt = (/* @__PURE__ */ new Date()).toISOString();
  const raws = extractRows(payload);
  const rows = [];
  const seen = /* @__PURE__ */ new Set();
  let skipped = 0;
  for (const r of raws) {
    const mapped = mapRow(r, sourceEndpoint, syncedAt);
    if (!mapped) {
      skipped += 1;
      continue;
    }
    if (seen.has(mapped.record_key)) {
      const idx = rows.findIndex((x) => x.record_key === mapped.record_key);
      rows[idx] = mapped;
      continue;
    }
    seen.add(mapped.record_key);
    rows.push(mapped);
  }
  return { received: raws.length, rows, skipped };
}

// ../src/lib/sap-pull-shared.ts
function salvageTruncatedArray(text) {
  const trimmed = text.trimStart();
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
function extractEmbeddedBody(text) {
  const marker = '"body":"';
  const start = text.indexOf(marker);
  if (start < 0) return null;
  const raw = text.slice(start + marker.length);
  try {
    const safe = raw.replace(/\\$/, "");
    return JSON.parse(`"${safe.replace(/"$/, "")}"`);
  } catch {
    return raw.replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\t/g, "	").replace(/\\\\/g, "\\");
  }
}
function withPostingDates(raw) {
  if (!raw || !raw.trim()) return raw ?? void 0;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return raw;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return raw;
  const obj = parsed;
  const sapDate = (daysAgo) => {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() - daysAgo);
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  };
  const valid = (v) => /^\d{8}$/.test(String(v ?? "").trim());
  if ("BUDAT_F" in obj && !valid(obj["BUDAT_F"])) obj["BUDAT_F"] = sapDate(7);
  if ("BUDAT_T" in obj && !valid(obj["BUDAT_T"])) obj["BUDAT_T"] = sapDate(0);
  return JSON.stringify(obj);
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
  extractEmbeddedBody,
  extractRows,
  formatBytes,
  keyValueObject,
  mapPayload,
  mapRow,
  salvageTruncatedArray,
  toIsoDate,
  withPostingDates
};
