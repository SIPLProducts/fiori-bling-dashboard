import { describe, expect, it } from "bun:test";
import { isSitEndpoint, mapSitPayload } from "../src/lib/sit-map";
import { toSitDashboardRow } from "../src/lib/sit-data";
import { buildPayloadText, parsePayloadFields } from "../src/lib/payload-fields";
import { withEndpointDates } from "../src/lib/sap-pull-shared";

const SAMPLE = { VBELN: "0900221025", POSNR: 10, WERKS: "1100", PRCTR: "PGNLB11001", NETWR: "                     8,220.00", NETWR_TOT: 8220, FKDAT: "2026-03-24", BEZEI_SO: "Navi Mumbai", CELLCOLOR: [] };
const PAYLOAD = '{\n  "VKORG": "1000",\n  "FKDAT_F": "20260331"\n//    "FKDAT_T": "20260331"\n}';

describe("SIT mapper", () => {
  it("keys rows on VBELN + POSNR and types numbers and dates", () => {
    const { rows, invalid } = mapSitPayload([SAMPLE, { POSNR: 20 }], "Sales In Transit (SIT)");
    expect(invalid).toBe(1);
    expect(rows[0]).toMatchObject({ vbeln: "0900221025", posnr: "10", werks: "1100", prctr: "PGNLB11001", netwr: 8220, netwr_tot: 8220, fkdat: "2026-03-24", cellcolor: null });
  });
  it("recognises the SIT endpoint but not Order Book", () => {
    expect(isSitEndpoint("Sales In Transit (SIT)")).toBe(true);
    expect(isSitEndpoint("/zsit_bg/sit?sap-client=234")).toBe(true);
    expect(isSitEndpoint("Order_Book")).toBe(false);
  });
  it("uses NETWR_TOT in ₹ Cr as the screen value and BEZEI_SO as zone", () => {
    const row = toSitDashboardRow({ vbeln: "1", posnr: "10", netwr_tot: 50_000_000, bezei_so: "Navi Mumbai" });
    expect(row.value).toBe(5);
    expect(row.zone).toBe("Navi Mumbai");
  });
});

describe("payload fields", () => {
  it("reads pasted keys, marking commented ones optional", () => {
    expect(parsePayloadFields(PAYLOAD)).toEqual([
      { key: "VKORG", value: "1000", optional: false, date: false },
      { key: "FKDAT_F", value: "20260331", optional: false, date: true },
      { key: "FKDAT_T", value: "", optional: true, date: true },
    ]);
  });
  it("sends a filled optional field and leaves an empty one out", () => {
    const fields = parsePayloadFields(PAYLOAD)!;
    const filled = buildPayloadText(fields.map((f) => (f.key === "FKDAT_T" ? { ...f, value: "20260430" } : f)));
    expect(JSON.parse(withEndpointDates("Sales In Transit (SIT)", filled, "custom")!)).toEqual({ VKORG: "1000", FKDAT_F: "20260331", FKDAT_T: "20260430" });
    expect(JSON.parse(withEndpointDates("Sales In Transit (SIT)", PAYLOAD, "custom")!)).toEqual({ VKORG: "1000", FKDAT_F: "20260331" });
  });
});

import { defaultDocumentTypeKeys } from "../src/lib/open-sales-orders-filters";
it("SIT billing types are all pre-selected when no ZDOR/ZEOR/ZSOR rows exist", () => {
  const rows = [{ documentType: "Domestic Invoice" }, { documentType: "Export Invoice" }] as never[];
  expect(defaultDocumentTypeKeys(rows).length).toBe(2);
});

import { summarizeLaunchOrders } from "../src/lib/open-orders-launch-summary";
it("SIT launch tile labels ZDOR rows by VTEXT_DC", () => {
  const s = summarizeLaunchOrders([{ p_value1: 1e7, sales_type: "Domestic Sales", order_type: "ZDOR" }] as never, { all: true });
  expect(JSON.stringify(s)).toContain("Domestic Sales");
  expect(JSON.stringify(s)).not.toContain("Invoice");
});

describe("SIT From date", () => {
  const body = '{"VKORG":"1000","FKDAT_F":"20260101"}';
  const day = new Date(2026, 9, 22, 12);
  it("scheduled run sends today's date", () => {
    expect(JSON.parse(withEndpointDates("Sales In Transit (SIT)", body, "custom", day, true)!).FKDAT_F).toBe("20261022");
  });
  it("manual run keeps the chosen date", () => {
    expect(JSON.parse(withEndpointDates("Sales In Transit (SIT)", body, "custom", day)!).FKDAT_F).toBe("20260101");
  });
  it("empty From date falls back to today", () => {
    expect(JSON.parse(withEndpointDates("Sales In Transit (SIT)", '{"VKORG":"1000","FKDAT_F":""}', "custom", day)!).FKDAT_F).toBe("20261022");
  });
});

import { staleSitKeys } from "../src/lib/sit-map";
describe("staleSitKeys", () => {
  const a = { vbeln: "1", posnr: "10" }, b = { vbeln: "1", posnr: "20" }, c = { vbeln: "2", posnr: "10" };
  it("flags lines missing from the response", () => expect(staleSitKeys([a, b, c], [a, c])).toEqual([b]));
  it("keeps lines present in the response", () => expect(staleSitKeys([a], [a])).toEqual([]));
  it("empty response flags every line", () => expect(staleSitKeys([a, b], [])).toEqual([a, b]));
});
