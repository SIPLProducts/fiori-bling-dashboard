import { describe, expect, it } from "vitest";
import { mapSoAgeingPayload, withSoAgeingDate } from "./so-ageing-map";
import { ageTotals, bucketLabels, toAgeRow } from "./so-ageing-data";

describe("SO Ageing", () => {
  it("scheduled request sends today's IST key date and padded buckets", () => {
    const out = JSON.parse(withSoAgeingDate('{"P_BUDAT":"20260101","P2_BKT1":"90","P2_BKT2":"","P2_BKT3":"365"}', new Date("2026-11-23T20:00:00Z"), true)!);
    expect(out.P_BUDAT).toBe("20261124");
    expect([out.P2_BKT1, out.P2_BKT2, out.P2_BKT3]).toEqual(["0090", "0180", "0365"]);
  });
  it("manual request keeps a saved key date", () => {
    expect(JSON.parse(withSoAgeingDate('{"P_BUDAT":"20261001"}', new Date("2026-11-23T06:00:00Z"))!).P_BUDAT).toBe("20261123");
  });
  it("maps the sample line and totals the buckets", () => {
    const { rows } = mapSoAgeingPayload({ DATA: [{ WERKS: "1100", PLANT_NAME: "NCPP", LGORT: "S055", MATNR: "1000011852", BUCK2: 911.594, VALU2: 1685719.62, CL_STCK: 911.594, PRICE: 1685719.62, MBLNR: "4904741716", MJAHR: 2026, BLDAT: "2026-06-10", CHARG: "0000497050" }] }, "SO_Ageing", { body: '{"P_BUDAT":"20261123","P2_BKT1":"0090","P2_BKT2":"0180","P2_BKT3":"0365"}' });
    const r = toAgeRow(rows[0]!);
    expect(r.keyDate).toBe("2026-11-23");
    expect(bucketLabels(r.bkt)).toEqual(["0–90", "91–180", "181–365", ">365"]);
    expect(ageTotals([r]).v[1]).toBeCloseTo(1685719.62);
  });
});

describe("Inventory Aging request body", () => {
  it("matches the SAP payload exactly", () => {
    const keys = ["WERKS", "MATNR", "MTART", "MATKL", "LGORT"];
    const input: Record<string, string> = { P_BUDAT: "", BUDAT_F: "20261127", BUDAT_T: "20261127", P2_BKT1: "0090", P2_BKT2: "0180", P2_BKT3: "0365" };
    for (const k of keys) { input[`${k}_FROM`] = ""; input[`${k}_TO`] = ""; }
    const out = JSON.parse(withSoAgeingDate(JSON.stringify(input), new Date("2026-11-27T06:00:00Z"))!);
    const expected: Record<string, unknown> = { P_BUDAT: "20261127", P2_BKT1: "0090", P2_BKT2: "0180", P2_BKT3: "0365" };
    for (const k of keys) { expected[`${k}_FROM`] = []; expected[`${k}_TO`] = []; }
    expect(out).toEqual(expected);
  });
});

describe("Inventory Aging key date mode", () => {
  const now = new Date("2026-11-27T06:00:00Z");
  it("custom manual run sends the picked date", () => {
    expect(JSON.parse(withSoAgeingDate('{"P_BUDAT":"20261001"}', now, false, "custom")!).P_BUDAT).toBe("20261001");
  });
  it("scheduled run ignores the custom date", () => {
    expect(JSON.parse(withSoAgeingDate('{"P_BUDAT":"20261001"}', now, true, "custom")!).P_BUDAT).toBe("20261127");
  });
});
