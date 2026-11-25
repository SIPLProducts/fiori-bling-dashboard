type DatedRow = { date: string };
/** year/month: null = all; otherwise the ticked values (an empty list also means all). */
export type DprDateFilters = { year: string[] | null; month: string[] | null; from: string; to: string };

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const any = (list: string[] | null) => !list || list.length === 0;

/** Default to the latest available posting month, with optional dates unset. */
export function defaultDprDates(rows: readonly DatedRow[]): DprDateFilters {
  const latest = rows.reduce((max, r) => ISO.test(r.date) && r.date > max ? r.date : max, "");
  return latest ? { year: [latest.slice(0, 4)], month: [latest.slice(5, 7)], from: "", to: "" } : { year: null, month: null, from: "", to: "" };
}

/** Years latest first; months available in the ticked years, latest first. */
export function dprDateOptions(rows: readonly DatedRow[], years: string[] | null) {
  const dates = rows.map((r) => r.date).filter((date) => ISO.test(date));
  return {
    years: [...new Set(dates.map((date) => date.slice(0, 4)))].sort().reverse(),
    months: [...new Set(dates.filter((date) => any(years) || years!.includes(date.slice(0, 4))).map((date) => date.slice(5, 7)))].sort().reverse(),
  };
}

export function matchesDprDates(date: string, filters: DprDateFilters) {
  return (any(filters.year) || filters.year!.includes(date.slice(0, 4)))
    && (any(filters.month) || filters.month!.includes(date.slice(5, 7)))
    && (!filters.from || date >= filters.from)
    && (!filters.to || date <= filters.to);
}
