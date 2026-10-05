import { describe, expect, test } from "bun:test";
import { mapOpenSalesOrdersPayload } from "../src/lib/open-sales-orders-map";

const sample = [
  { VBELN: "1027671", POSNR: 150, ERDAT: "2017-07-18", KWMENG: "703922.000", KWMENG_P: "170480", RFMNG: 533442, P_VALUE1: "10683424.19", NETWR: "999", WERKS_NAME: "HBL NCPP-SHPT", marker: "preserved" },
  { VBELN: "1027920", POSNR: 50, ERDAT: "2017-07-21", KWMENG: "1.000", KWMENG_P: "1.000", NETWR: "0.00" },
];

describe("Open Sales Orders mapping", () => {
  test("maps the attached VBELN + POSNR keys and preserves the raw response", () => {
    const result = mapOpenSalesOrdersPayload(sample, "Open _Sales _Orders");
    expect(result.rows.map((row) => [row.sales_order, row.sales_order_item])).toEqual([["1027671", "150"], ["1027920", "50"]]);
    expect(result.rows[0]?.raw).toEqual(sample[0]);
  });

  test("normalizes quantities, dates, descriptions and pending value fallback", () => {
    const row = mapOpenSalesOrdersPayload(sample.slice(0, 1), "Open _Sales _Orders").rows[0];
    expect(row?.order_date).toBe("2017-07-18");
    expect(row?.quantity).toBe(703922);
    expect(row?.open_quantity).toBe(170480);
    expect(row?.delivered_quantity).toBe(533442);
    expect(row?.open_value).toBe(10683424.19);
    expect(row?.plant_name).toBe("HBL NCPP-SHPT");
  });

  test("rejects missing and duplicate business keys", () => {
    expect(() => mapOpenSalesOrdersPayload([{ VBELN: "1" }], "Open_Sales_Orders")).toThrow(/without VBELN \+ POSNR/);
    expect(() => mapOpenSalesOrdersPayload([{ VBELN: "1", POSNR: 10 }, { VBELN: "1", POSNR: "10" }], "Open_Sales_Orders")).toThrow(/duplicate VBELN \+ POSNR/);
  });
});