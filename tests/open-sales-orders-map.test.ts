import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { mapOpenSalesOrdersPayload } from "../src/lib/open-sales-orders-map";

const uploaded = "/mnt/user-uploads/APPTYP_SECTOR_VTWEG_01_pasted.txt";
const sample = JSON.parse(`[${readFileSync(uploaded, "utf8").trim().replace(/,\s*$/, "")}]`) as Record<string, unknown>[];

describe("Open Sales Orders mapping", () => {
  test("maps the attached VBELN + POSNR keys and preserves the raw response", () => {
    const result = mapOpenSalesOrdersPayload(sample, "Open _Sales _Orders");
    expect(result.rows.map((row) => [row.sales_order, row.sales_order_item])).toEqual([["1027671", "150"], ["1027920", "50"]]);
    expect(Object.keys(result.rows[0]?.raw ?? {})).toHaveLength(125);
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