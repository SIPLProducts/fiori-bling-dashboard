import { expect, test } from "bun:test";
import { currentReportPeriod, currentReportDateRange } from "../src/lib/report-period";
import { lastSyncedLabel, matchesReportEndpoint } from "../src/lib/report-sync-time";

test("9 October opening and Reset share April 2026 through India today", () => {
  const now = new Date("2026-10-09T05:53:00Z");
  expect(currentReportPeriod(now)).toEqual({ fiscalYear: "2026", from: "2026-04-01", to: "2026-10-09" });
  expect(currentReportDateRange(now).from.getMonth()).toBe(3);
  expect(currentReportDateRange(now).to.getDate()).toBe(9);
});
test("January to March stays in prior April fiscal year", () => {
  expect(currentReportPeriod(new Date("2027-01-15T06:00:00Z"))).toEqual({ fiscalYear: "2026", from: "2026-04-01", to: "2027-01-15" });
});
test("India midnight on April 1 rolls the fiscal year even before UTC midnight", () => {
  expect(currentReportPeriod(new Date("2026-03-31T18:30:00Z"))).toEqual({ fiscalYear: "2026", from: "2026-04-01", to: "2026-04-01" });
});
test("sync endpoint matching isolates datasets and supports legacy spacing", () => {
  expect(matchesReportEndpoint("Open_Sales_Orders", "open-sales-orders")).toBe(true);
  expect(matchesReportEndpoint("Open Sales Orders", "open-sales-orders")).toBe(true);
  expect(matchesReportEndpoint("Sales_Reports_KPI", "net-sales")).toBe(true);
  expect(matchesReportEndpoint("Sales_Reports_KPI", "open-sales-orders")).toBe(false);
});
test("sync timestamp is exact India time and absent/invalid times are not invented", () => {
  expect(lastSyncedLabel("2026-10-09T05:53:00Z")).toBe("Last synced: 09.10.2026, 11:23 am IST");
  expect(lastSyncedLabel(null)).toBe("Sync time unavailable");
  expect(lastSyncedLabel("invalid")).toBe("Sync time unavailable");
});