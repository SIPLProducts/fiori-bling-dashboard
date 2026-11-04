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
  it("groups PO type and splits vendor code/name", () => {
    const r = toPoRow({ po: "1", po_doc_type: "ZPNI", name_of_vendor: "4000068    FUTURE ELECTRONICS INC.", currency_key: "INR" });
    expect(r.poType).toBe("DOMESTIC");
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
