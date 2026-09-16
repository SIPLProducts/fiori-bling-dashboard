import assert from "node:assert/strict";
import test from "node:test";
import { canonicalJson, mapPayload, sha256 } from "../src/lib/zfisales-map";

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

test("exact duplicates collapse and reconcile with received rows", () => {
  const row = { ...base, PRCTR: "LGVRD16001", DMBTR: "100" };
  const result = mapPayload([row, { ...row }], "Sales_Reports_KPI");
  assert.equal(result.rows.length, 1);
  assert.equal(result.duplicates, 1);
  assert.equal(result.received, result.rows.length + result.invalid + result.duplicates);
});

test("property order does not change full-row identity", () => {
  const first = { BELNR: "1", GJAHR: 2026, PRCTR: "A" };
  const second = { PRCTR: "A", GJAHR: 2026, BELNR: "1" };
  assert.equal(sha256(canonicalJson(first)), sha256(canonicalJson(second)));
});