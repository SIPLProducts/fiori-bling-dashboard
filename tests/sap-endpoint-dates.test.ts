import { describe, expect, test } from "bun:test";
import { withEndpointDates, withOpenSalesOrdersDate } from "../src/lib/sap-pull-shared.ts";

const runDate = new Date(2026, 9, 5, 12, 0, 0);
const payload = JSON.stringify({ fkdat: "20260921", BUDAT_F: "20260928", marker: "keep" });

describe("Open Sales Orders request date", () => {
  test("manual and Test requests retain the selected fkdat", () => {
    const result = JSON.parse(withEndpointDates("Open_Sales_Orders", payload, "last7d", runDate) ?? "{}");
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
      withEndpointDates("Sales_Reports_KPI", payload, "last7d", runDate) ?? "{}",
    );
    expect(result["BUDAT_F"]).toBe("20260928");
    expect(result["fkdat"]).toBe("20260921");
  });
});