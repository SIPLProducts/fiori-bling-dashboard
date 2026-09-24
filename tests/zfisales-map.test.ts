import assert from "node:assert/strict";
import test from "node:test";
import { canonicalJson, mapPayload, sha256 } from "../src/lib/zfisales-map.ts";

const base = { WERKS: "", GJAHR: 2026, BELNR: "0100035244", BUZEI: "10", HKONT: "31111100" };

test("full-row identity retains rows that collided under the old business key", () => {
  const result = mapPayload([
    { ...base, PRCTR: "LGVRD16001", DMBTR: "100" },
    { ...base, PRCTR: "PGNLB11001", DMBTR: "100" },
  ], "Sales_Reports_KPI");
  assert.equal(result.received, 2);
  assert.equal(result.rows.length, 2);
  assert.equal(result.duplicates, 0);
  assert.notEqual(result.rows[0].record_key, result.rows[1].record_key);
});

test("exact duplicate occurrences are all preserved", () => {
  const row = { ...base, PRCTR: "LGVRD16001", DMBTR: "100" };
  const result = mapPayload([row, { ...row }], "Sales_Reports_KPI");
  assert.equal(result.rows.length, 2);
  assert.equal(result.duplicates, 1);
  assert.equal(result.received, result.rows.length + result.invalid);
  assert.equal(result.rows[0].row_hash, result.rows[1].row_hash);
  assert.equal(result.rows[0].occurrence_no, 1);
  assert.equal(result.rows[1].occurrence_no, 2);
  assert.notEqual(result.rows[0].record_key, result.rows[1].record_key);
});

test("persists BELNR, GJAHR, HKONT, AUBEL, AUPOS, and POSNR in their mapped columns", () => {
  const result = mapPayload([{
    ...base,
    BELNR: "0100025169",
    GJAHR: 2026,
    HKONT: "31111100",
    AUBEL: "0001176212",
    AUPOS: "20",
    POSNR: "30",
  }], "Sales_Reports_KPI");

  expect(result.rows[0]).toMatchObject({
    doc_no: "0100025169",
    fiscal_year: "2026",
    gl: "31111100",
    sales_order: "0001176212",
    sales_order_item: "20",
    doc_item: "30",
  });
});

test("preserves distinct rows that share all six requested SAP key fields", () => {
  const sharedKeys = {
    ...base,
    AUBEL: "0001176212",
    AUPOS: "20",
    POSNR: "30",
  };
  const result = mapPayload([
    { ...sharedKeys, PRCTR: "PGNLB12001", DMBTR: 100 },
    { ...sharedKeys, PRCTR: "PGNLB12002", DMBTR: 200 },
  ], "Sales_Reports_KPI");

  expect(result.rows).toHaveLength(2);
  expect(result.rows[0]?.row_hash).not.toBe(result.rows[1]?.row_hash);
  expect(result.rows[0]?.record_key).not.toBe(result.rows[1]?.record_key);
});

test("request scope is stable and different filters remain isolated", () => {
  const first = mapPayload([base], "Sales_Reports_KPI", { body: { BUDAT_F: "20260901", BUDAT_T: "20260916" } });
  const same = mapPayload([base], "Sales_Reports_KPI", { body: { BUDAT_F: "20260901", BUDAT_T: "20260916" } });
  const other = mapPayload([base], "Sales_Reports_KPI", { body: { BUDAT_F: "20260801", BUDAT_T: "20260831" } });
  assert.equal(first.syncScopeKey, same.syncScopeKey);
  assert.notEqual(first.syncScopeKey, other.syncScopeKey);
  assert.notEqual(first.snapshotId, same.snapshotId);
});

test("property order does not change full-row identity", () => {
  const first = { BELNR: "1", GJAHR: 2026, PRCTR: "A" };
  const second = { PRCTR: "A", GJAHR: 2026, BELNR: "1" };
  assert.equal(sha256(canonicalJson(first)), sha256(canonicalJson(second)));
});

test("SHA-256 implementation matches the standard digest", () => {
  assert.equal(
    sha256("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});

test("ABTEI is mapped as the Profit Centre dropdown display value", () => {
  const result = mapPayload([{ ...base, ABTEI: "VNCPP", KTEXT: "Fallback" }], "Sales_Reports_KPI");
  assert.equal(result.rows[0]?.pc_short_name, "VNCPP");
});

test("BSARK fills new_repl while explicit NEW_REPL remains authoritative", () => {
  const fromBsark = mapPayload([{ ...base, BSARK: "REPL", XBLNR: "900221960", BSCHL: "40" }], "Sales_Reports_KPI");
  const explicit = mapPayload([{ ...base, NEW_REPL: "NEW", BSARK: "REPL" }], "Sales_Reports_KPI");
  assert.equal(fromBsark.rows[0]?.new_repl, "REPL");
  assert.equal(fromBsark.rows[0]?.reference, "900221960");
  assert.equal(fromBsark.rows[0]?.pk, "40");
  assert.equal(explicit.rows[0]?.new_repl, "NEW");
});

test("MNGRP1 and PCGRP1 map to main group and sub group", () => {
  const result = mapPayload([
    { ...base, MNGRP1: "INDL.BATTERY", PCGRP1: "BATTERY" },
  ], "Sales_Reports_KPI");

  assert.equal(result.rows[0]?.main_group, "INDL.BATTERY");
  assert.equal(result.rows[0]?.sub_group, "BATTERY");
  assert.equal(result.rows[0]?.product_group, "BATTERY");
});

test("explicit subgroup remains authoritative over PCGRP1", () => {
  const result = mapPayload([
    { ...base, SUBGRP1: "EXPLICIT", PCGRP1: "BATTERY" },
  ], "Sales_Reports_KPI");

  assert.equal(result.rows[0]?.sub_group, "EXPLICIT");
});