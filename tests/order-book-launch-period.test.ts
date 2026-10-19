import { expect, test } from "bun:test";
import { currentReportPeriod, inReportPeriod } from "../src/lib/report-period";

test("Order Book launchpad counts only current FY created dates", () => {
  const period = currentReportPeriod(new Date("2026-10-19T12:00:00Z"));
  expect(inReportPeriod("2026-03-31", period)).toBe(false);
  expect(inReportPeriod("2026-04-01", period)).toBe(true);
  expect(inReportPeriod("2026-10-19", period)).toBe(true);
  expect(inReportPeriod(null, period)).toBe(false);
});
