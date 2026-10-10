import { describe, expect, test } from "bun:test";
import { mapOpenSalesOrdersPayload } from "../src/lib/open-sales-orders-map";

const sample = [
  { VBELN: "1027671", POSNR: 150, ERDAT: "2017-07-18", KWMENG: "703922.000", KWMENG_P: "170480", RFMNG: 533442, P_VALUE1: "10683424.19", NETWR: "999", WERKS_NAME: "HBL NCPP-SHPT", marker: "preserved" },
  { VBELN: "1027920", POSNR: 50, ERDAT: "2017-07-21", KWMENG: "1.000", KWMENG_P: "1.000", NETWR: "0.00" },
];

describe("Open Sales Orders mapping", () => {
  test("stores S_VTWEG and VTEXT_DC with legacy and lowercase compatibility", () => {
    for (const fields of [{ S_VTWEG: "02", VTEXT_DC: "Export Sales", VTWEG: "01" }, { s_vtweg: "02", vtext_dc: "Export Sales" }, { VTWEG: "02", VTEXT_DC: "Export Sales" }]) {
      const row = mapOpenSalesOrdersPayload([{ VBELN: "1", POSNR: "10", ...fields }], "Open_Sales_Orders").rows[0];
      expect(row?.distribution_channel).toBe("02");
      expect(row?.sales_type).toBe("Export Sales");
    }
  });
  test("maps unscaled SAP AH and TOT_AH including decimals and trailing minus", () => {
    for (const [input, expected] of [["1234", 1234], ["1,234.567", 1234.567], ["12.5-", -12.5], ["", 0], [undefined, 0], ["invalid", 0]] as const) {
      const row = mapOpenSalesOrdersPayload([{ VBELN: "1", POSNR: "10", AH: input, TOT_AH: input }], "Open_Sales_Orders").rows[0];
      expect(row?.ah).toBe(expected);
      expect(row?.total_ah).toBe(expected);
    }
  });
  test("maps the attached VBELN + POSNR keys and preserves the raw response", () => {
    const result = mapOpenSalesOrdersPayload(sample, "Open _Sales _Orders");
    expect(result.rows.map((row) => [row.sales_order, row.sales_order_item])).toEqual([["1027671", "150"], ["1027920", "50"]]);
    expect(result.rows[0]?.raw).toEqual(sample[0]);
  });

  test("normalizes quantities, dates, descriptions and uses NETWR without quantity scaling", () => {
    const row = mapOpenSalesOrdersPayload(sample.slice(0, 1), "Open _Sales _Orders").rows[0];
    expect(row?.order_date).toBe("2017-07-18");
    expect(row?.quantity).toBe(703922);
    expect(row?.open_quantity).toBe(170480);
    expect(row?.delivered_quantity).toBe(533442);
    expect(row?.open_value).toBe(999);
    expect(row?.plant_name).toBe("HBL NCPP-SHPT");
  });

  test("maps the SAP NETWR amount even when P_VALUE1 is zero", () => {
    const row = mapOpenSalesOrdersPayload([{ VBELN: "1122775", POSNR: "10", NETWR: "   151770.00", P_VALUE1: 0 }], "Open_Sales_Orders").rows[0];
    expect(row?.open_value).toBe(151770);
  });

  test("never substitutes pending or condition values for missing or zero NETWR", () => {
    for (const NETWR of [undefined, null, "", "0.00", "invalid"]) {
      const row = mapOpenSalesOrdersPayload([{ VBELN: "1", POSNR: "10", NETWR, P_VALUE1: 500, P_VALUE: 600, openValue: 700, KWERT_INR: 800 }], "Open_Sales_Orders").rows[0];
      expect(row?.open_value).toBe(0);
    }
  });

  test("rejects missing and duplicate business keys", () => {
    expect(() => mapOpenSalesOrdersPayload([{ VBELN: "1" }], "Open_Sales_Orders")).toThrow(/without VBELN \+ POSNR/);
    expect(() => mapOpenSalesOrdersPayload([{ VBELN: "1", POSNR: 10 }, { VBELN: "1", POSNR: "10" }], "Open_Sales_Orders")).toThrow(/duplicate VBELN \+ POSNR/);
  });
});