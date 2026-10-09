import { currentFiscalYearRange } from "./sd-live";

/** Share India-local April–March bounds between report opening and launchpad. */
export function currentReportPeriod(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return currentFiscalYearRange(new Date(Number(part("year")), Number(part("month")) - 1, Number(part("day")), 12));
}

export function currentReportDateRange(now = new Date()) {
  const range = currentReportPeriod(now);
  const date = (value: string) => {
    const [year = 0, month = 1, day = 1] = value.split("-").map(Number);
    return new Date(year, month - 1, day, 12);
  };
  return { from: date(range.from), to: date(range.to) };
}

export function reportPeriodLabel(range: ReturnType<typeof currentReportPeriod>) {
  const display = (value: string) => value.split("-").reverse().join(".");
  return `FY ${range.fiscalYear}–${String(Number(range.fiscalYear) + 1).slice(-2)} · ${display(range.from)} – ${display(range.to)}`;
}