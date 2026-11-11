import { describe, expect, it } from "vitest";
import { mapPurchaseOrdersPayload, isPurchaseOrdersEndpoint } from "./purchase-orders-map";
import { deliveryStatus, poTotals, toPoRow } from "./purchase-orders-data";
import { withEndpointDates } from "./sap-pull-shared";

const sample = { PO: "4700020419", PO_ITEM: 1, PO_DATE: "2025-04-12", DELIVERY_DATE: "2025-04-21", PO_DOC_TYPE: "ZPNI", PLANT: "1300", PLT_SHORT: "TMK", NAME_OF_VENDOR: "1101 HBL CS-SHPT", NET_ORDER_VALUE: 110, CURRENCY_KEY: "INR", STILL_TO_BE_DELIVERED_QTY: 0 };

describe("ZME2N purchase orders", () => {
  it("matches only the ZME2N endpoint, not Open PO", () => {
    expect(isPurchaseOrdersEndpoint("Purchase_Orders")).toBe(true);
    expect(isPurchaseOrdersEndpoint("/zme2n/me2n?sap-client=234")).toBe(true);
    expect(isPurchaseOrdersEndpoint("Open_Purchase_Order")).toBe(false);
  });
  it("maps PO + item and typed fields", () => {
    const { rows } = mapPurchaseOrdersPayload([sample, sample], "Purchase_Orders");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ po: "4700020419", po_item: "1", po_date: "2025-04-12", plt_short: "TMK", net_order_value: 110 });
  });
  it("uses raw PO_DOC_TYPE and splits vendor code/name", () => {
    const r = toPoRow({ po: "1", po_doc_type: "ZPNI", name_of_vendor: "4000068    FUTURE ELECTRONICS INC.", currency_key: "INR" });
    expect(r.poType).toBe("ZPNI");
    expect(r.vendorName).toBe("FUTURE ELECTRONICS INC.");
  });
  it("delivery status: delivered / overdue / pending", () => {
    expect(deliveryStatus({ pendDelQty: 0, deliveryDate: "2020-01-01" }, "2026-11-04")).toBe("Delivered");
    expect(deliveryStatus({ pendDelQty: 5, deliveryDate: "2026-11-01" }, "2026-11-04")).toBe("Overdue");
    expect(deliveryStatus({ pendDelQty: 5, deliveryDate: "2026-11-30" }, "2026-11-04")).toBe("Pending");
  });
  it("₹ totals exclude foreign-currency lines", () => {
    const t = poTotals([toPoRow({ po: "1", net_order_value: 100, currency_key: "INR" }), toPoRow({ po: "2", net_order_value: 50, currency_key: "USD" })]);
    expect(t.value).toBe(100);
    expect(t.foreignLines).toBe(1);
  });
  it("Today sends empty from_date and today's to_date with lowercase keys", () => {
    const saved = JSON.stringify({ plant: [], document_date: { from_date: "20260101", to_date: "" }, status: "R6" });
    const sent = JSON.parse(withEndpointDates("Purchase_Orders", saved, "today", new Date("2026-11-12T06:00:00Z"))!);
    expect(sent.document_date).toEqual({ from_date: "", to_date: "20261112" });
    expect(sent.DOCUMENT_DATE).toBeUndefined();
  });
});

import { poAgingBand as _band } from "./purchase-orders-data";
describe("poAgingBand (NO_OF_DAYS)", () => {
  it("bands boundaries", () => {
    expect([0, 60, 61, 180, 181, 365, 366, -5].map(_band)).toEqual(["0 – 60", "0 – 60", "61 – 180", "61 – 180", "181 – 365", "181 – 365", "> 365", "0 – 60"]);
  });
});

import { quarterlyCompare as qcmp, monthlyByGroup as mbg, poGroup as pg } from "./purchase-orders-data";
describe("PO register-style helpers", () => {
  const base = { inr: true, netValue: 100, poTypeCode: "ZPNI" } as never as import("./purchase-orders-data").PoRow;
  it("groups ZPNI as DOMESTIC", () => { expect(pg({ poTypeCode: "ZPNI" })).toBe("DOMESTIC"); });
  it("compares Apr–Mar quarters against previous FY", () => {
    const r = qcmp([{ ...base, poDate: "2026-05-10" }, { ...base, poDate: "2025-05-10", netValue: 50 }, { ...base, poDate: "2027-01-05" }]);
    expect(r.fy).toBe(2027); expect(r.data[0]).toEqual({ name: "Q1", current: 100, previous: 50 }); expect(r.data[3]!.current).toBe(100); expect(r.yoy).toBe(300);
  });
  it("stacks monthly value by group", () => { expect(mbg([{ ...base, poDate: "2026-05-10" }])[0]).toMatchObject({ month: "May-26", DOMESTIC: 100, total: 100 }); });
});

describe("ZPO_LIST purchase orders", () => {
  const z = { EBELN: "4100013323", EBELP: 1, PO_DATE: "2026-04-01", EINDT: "2026-04-15", BSART: "ZPCP", SUPERFIELD: "CHILL AIR ENGINEERING", EKGRP: "010", TXZ01: "AIR CONDITIONER", WERKS: "1200", LGORT: "S001", MENGE: 1, MEINS: "NOS", NETPR: 53396, WAERS: "INR", PEINH: 1, NETWR: 53396, MAIN_GROUP: "INDL.BTY", SUB_GROUP: "BATTERY", SUB_GROUP2: "NICKEL", DIVISION_NAME: "VSEZ" };
  it("detects the new endpoint path", () => expect(isPurchaseOrdersEndpoint("/zpo_list/polist?sap-client=234")).toBe(true));
  it("maps new keys into existing columns", () => {
    const r = mapPurchaseOrdersPayload([z], "Purchase_Orders").rows[0]!;
    expect(r).toMatchObject({ po: "4100013323", po_item: "1", delivery_date: "2026-04-15", po_doc_type: "ZPCP", name_of_vendor: "CHILL AIR ENGINEERING", plant: "1200", storage_location: "S001", net_order_value: 53396, mngrp1: "INDL.BTY", pcgrp1: "BATTERY", pcgrp2: "NICKEL", division_name: "VSEZ" });
  });
  it("fills BEDAT_FROM / BEDAT_TO from the date window", () => {
    const out = JSON.parse(withEndpointDates("Purchase_Orders", '{"EBELN":"","BEDAT_FROM":"","BEDAT_TO":""}', "custom", new Date("2026-11-11T06:00:00Z"))!);
    expect(out.BEDAT_TO).toBe("20261111");
    expect(out.document_date).toBeUndefined();
  });
});
