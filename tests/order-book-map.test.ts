import { describe, expect, it } from "vitest";
import { mapOrderBookPayload, isOrderBookEndpoint } from "../src/lib/order-book-map";
import { withEndpointDates } from "../src/lib/sap-pull-shared";

const line = { VBELN: "1161229", POSNR: 10, ERDAT: "2025-06-02", WERKS: "1600", PC_CODE: "LGVRD16001", NETWR: " 2178000.00", KWMENG_C: "  16", KWERT_BA: "", MAIN_GRP: "INDL.BATTERY" };

describe("order book mapper", () => {
  it("stores typed columns plus raw row, keyed by VBELN + POSNR", () => {
    const { rows, invalid, duplicates } = mapOrderBookPayload([line, { ...line, NETWR: "5" }, { POSNR: 20 }], "ORDER_BOOK");
    expect(rows).toHaveLength(1);
    expect(duplicates).toBe(1);
    expect(invalid).toBe(1);
    const r = rows[0];
    expect(r.sales_order_item).toBe("10");
    expect(r["netwr"]).toBe(5);
    expect(r["kwmeng_c"]).toBe(16);
    expect(r["kwert_ba"]).toBe(0);
    expect(r["created_date"]).toBe("2025-06-02");
    expect(r["plant"]).toBe("1600");
    expect(r["profit_center"]).toBe("LGVRD16001");
    expect(r.raw["MAIN_GRP"]).toBe("INDL.BATTERY");
  });

  it("recognises the endpoint and fills ERDAT window", () => {
    expect(isOrderBookEndpoint("ORDER_BOOK")).toBe(true);
    const body = withEndpointDates("ORDER_BOOK", '{"ERDAT_F":"20250601","ERDAT_T":"20250630"}', "last7d", new Date(2026, 9, 19));
    expect(JSON.parse(body!)).toMatchObject({ ERDAT_F: "20261012", ERDAT_T: "20261019" });
    const custom = withEndpointDates("ORDER_BOOK", '{"ERDAT_F":"20250601","ERDAT_T":"20250630"}', "custom");
    expect(JSON.parse(custom!)).toMatchObject({ ERDAT_F: "20250601", ERDAT_T: "20250630" });
  });
});
