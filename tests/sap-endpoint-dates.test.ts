import { describe, expect, test } from "bun:test";
import { withEndpointDates, withOpenSalesOrdersDate } from "../src/lib/sap-pull-shared.ts";

const runDate = new Date(2026, 9, 5, 12, 0, 0);
const payload = JSON.stringify({ fkdat: "20260921", BUDAT_F: "20260928", marker: "keep" });

describe("Open Sales Orders request date", () => {
  test("manual and Test requests retain the selected fkdat", () => {
    const result = JSON.parse(withEndpointDates("Open _Sales _Orders", payload, "last7d", runDate) ?? "{}");
    expect(result).toEqual({ fkdat: "20260921", BUDAT_F: "20260928", marker: "keep" });
  });

  test("scheduled requests use the current local date", () => {
    const result = JSON.parse(
      withEndpointDates("Open_Sales_Orders", payload, "last7d", runDate, true) ?? "{}",
    );
    expect(result).toEqual({ fkdat: "20261005", BUDAT_F: "20260928", marker: "keep" });
  });

  test("missing or invalid fkdat defaults to the current local date", () => {
    const result = JSON.parse(withOpenSalesOrdersDate('{"fkdat":"","marker":"keep"}', runDate) ?? "{}");
    expect(result).toEqual({ fkdat: "20261005", marker: "keep" });
  });

  test("other endpoints retain posting-window behavior", () => {
    const result = JSON.parse(
      withEndpointDates("Sales_Reports_KPI", payload, "custom", runDate) ?? "{}",
    );
    expect(result["BUDAT_F"]).toBe("20260928");
    expect(result["fkdat"]).toBe("20260921");
  });
});
describe("ZCASH_FLOW request payload", () => {
  test("is sent exactly as saved, without BUDAT dates", () => {
    const body = '{"company_code":"1000","fiscal_year":"2026","profit_center":[],"plant":[],"posting_date":{}}';
    expect(withEndpointDates("ZCASH_FLOW", body, "last7d", runDate, true)).toBe(body);
  });
});

describe("sales register MODE", () => {
  const body = '{"vkorg":"1000","fkdat_f":"20260301","fkdat_t":"20260331"}';
  test("scheduled run sends DAILY", () => {
    expect(JSON.parse(withEndpointDates("Sales _Register", body, "custom", new Date(), true)!).MODE).toBe("DAILY");
  });
  test("manual run sends ONETIME and keeps picked dates", () => {
    const out = JSON.parse(withEndpointDates("Sales _Register", body, "custom", new Date(), false)!);
    expect(out.MODE).toBe("ONETIME");
    expect(out.fkdat_f).toBe("20260301");
    expect(out.fkdat_t).toBe("20260331");
  });
});

describe("Sales Register daily sync window", () => {
  test("Last 7 days rolls only fkdat_f/fkdat_t and sends MODE DAILY", () => {
    const body = JSON.stringify({ fkdat_f: "20260301", fkdat_t: "20260331", erdat_f: "20260101", erdat_t: "", fkart_f: "" });
    const r = JSON.parse(withEndpointDates("Sales _Register", body, "last7d", new Date(2026, 9, 23), true) ?? "{}");
    expect(r).toEqual({ fkdat_f: "20261016", fkdat_t: "20261023", erdat_f: "20260101", erdat_t: "", fkart_f: "", MODE: "DAILY" });
  });
});
