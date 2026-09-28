import { describe, expect, test } from "bun:test";
import {
  dailySyncTimesExpression,
  describeSchedule,
  isValidScheduleExpression,
  nextScheduleRuns,
  parseDailySyncTimes,
} from "../src/lib/cron.ts";
import { dailyIstScheduleMatches, scheduleMatches } from "../middleware/scheduler.mjs";

describe("multiple daily SAP sync times", () => {
  const expression = dailySyncTimesExpression(["13:00", "05:30", "05:30"]);

  test("stores normalized unique IST times", () => {
    expect(expression).toBe("IST:05:30,13:00");
    expect(parseDailySyncTimes(expression)).toEqual(["05:30", "13:00"]);
    expect(isValidScheduleExpression(expression)).toBe(true);
    expect(describeSchedule(expression)).toBe("Runs daily at 05:30 and 13:00 IST");
  });

  test("matches the selected IST times regardless of server timezone", () => {
    expect(dailyIstScheduleMatches(expression, new Date("2026-09-28T00:00:00.000Z"))).toBe(true);
    expect(dailyIstScheduleMatches(expression, new Date("2026-09-28T07:30:00.000Z"))).toBe(true);
    expect(dailyIstScheduleMatches(expression, new Date("2026-09-28T07:31:00.000Z"))).toBe(false);
  });

  test("lists the next selected runs in chronological order", () => {
    expect(
      nextScheduleRuns(expression, 3, new Date("2026-09-28T00:01:00.000Z")).map((date) =>
        date.toISOString(),
      ),
    ).toEqual([
      "2026-09-28T07:30:00.000Z",
      "2026-09-29T00:00:00.000Z",
      "2026-09-29T07:30:00.000Z",
    ]);
  });

  test("keeps existing cron schedules working", () => {
    expect(scheduleMatches("0 5 * * *", new Date(2026, 8, 28, 5, 0))).toBe(true);
    expect(isValidScheduleExpression("*/10 * * * *")).toBe(true);
  });
});