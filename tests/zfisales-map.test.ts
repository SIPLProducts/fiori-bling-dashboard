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