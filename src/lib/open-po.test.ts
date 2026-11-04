import { describe, expect, it } from "vitest";
import { mapOpenPoPayload } from "./open-po-map";
import { agingBucket, openPoTotals, poStatus, toOpenPoRow } from "./open-po-data";
import { withEndpointDates } from "./sap-pull-shared";

const sap = { WERKS: "1100", EBELN: "4100013343", EBELP: 1, BEDAT: "02.04.2026", NETWR: 1246000, DMBTR1: 246000, MENGE1: 1, EINDT_DT: "2026-06-30", EINDT: "30.06.2026", MAIN_GRP: "INDL.BTY", PCGRP1: "BATTERY" };

describe("open purchase orders", () => {
  it("maps SAP dates, values and group aliases", () => {
    const { rows } = mapOpenPoPayload([sap, sap], "Open_Purchase_Order");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ ebeln: "4100013343", ebelp: "1", bedat: "2026-04-02", eindt: "2026-06-30", netwr: 1246000, mngrp1: "INDL.BTY", pcgrp1: "BATTERY" });
  });
  it("open value = PO value − MIGO value", () => {
    const r = toOpenPoRow(mapOpenPoPayload([sap], "x").rows[0] as never);
    expect(r.openValue).toBe(1000000);
    expect(openPoTotals([r])).toMatchObject({ poValue: 1246000, migoValue: 246000, openValue: 1000000, poCount: 1 });
  });
  it("ages by SAP DAYS into 0–60 / 61–180 / 181–365 / > 365", () => {
    const r = toOpenPoRow(mapOpenPoPayload([sap], "x").rows[0] as never);
    expect(agingBucket({ ...r, days: 60 })).toBe("0 – 60");
    expect(agingBucket({ ...r, days: 61 })).toBe("61 – 180");
    expect(agingBucket({ ...r, days: 180 })).toBe("61 – 180");
    expect(agingBucket({ ...r, days: 181 })).toBe("181 – 365");
    expect(agingBucket({ ...r, days: 365 })).toBe("181 – 365");
    expect(agingBucket({ ...r, days: 366 })).toBe("> 365");
    expect(poStatus(r, "2026-06-01")).toBe("Partially received");
    expect(poStatus(r, "2026-07-01")).toBe("Overdue");
  });
  it("sets DOCUMENT_DATE from the window preset", () => {
    const out = JSON.parse(withEndpointDates("Open_Purchase_Order", JSON.stringify({ PLANT: "", DOCUMENT_DATE: { FROM_DATE: "", TO_DATE: "" } }), "yesterday", new Date(2026, 10, 3))!);
    expect(out.DOCUMENT_DATE).toEqual({ FROM_DATE: "20261102", TO_DATE: "20261102" });
  });
  it("today sends empty FROM_DATE and today's TO_DATE", () => {
    const out = JSON.parse(withEndpointDates("Open_Purchase_Order", JSON.stringify({ PLANT: "", DOCUMENT_DATE: { FROM_DATE: "20260401", TO_DATE: "" } }), "today", new Date(2026, 10, 3))!);
    expect(out.DOCUMENT_DATE).toEqual({ FROM_DATE: "", TO_DATE: "20261103" });
    expect(out.PLANT).toBe("");
  });
});
