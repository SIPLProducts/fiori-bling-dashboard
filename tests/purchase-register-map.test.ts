import { expect, test } from "bun:test";
import { mapPurchaseRegisterPayload } from "../src/lib/purchase-register-map";

test("keys lines on BELNR+BUZEI+MBLNR+ZEILE and types fields", () => {
  const r = mapPurchaseRegisterPayload([
    { BELNR: "5105639626", BUZEI: 1, MBLNR: "5000840389", ZEILE: 1, WRBTR: -54000, BUDAT: "2025-11-01", WERKS: "1600" },
    { BELNR: "5105639626", BUZEI: 1, MBLNR: "5000840389", ZEILE: 1, WRBTR: -54000 },
    { BUZEI: 1 },
  ], "Purchase Register");
  expect(r.rows.length).toBe(1);
  expect(r.invalid).toBe(1);
  expect(r.rows[0].wrbtr).toBe(-54000);
  expect(r.rows[0].buzei).toBe("1");
});
