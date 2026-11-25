type DatedRow = { date: string };
export type DprDateFilters = { year: string; month: string; from: string; to: string };

/** Default to the latest available posting month, with optional dates unset. */
export function defaultDprDates(rows: readonly DatedRow[]): DprDateFilters {
  const latest = rows.reduce((max, r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date) && r.date > max ? r.date : max, "");
  return { year: latest.slice(0, 4) || "all", month: latest.slice(5, 7) || "all", from: "", to: "" };
}

export function dprDateOptions(rows: readonly DatedRow[], year: string) {
  const dates = rows.map((r) => r.date).filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date));
  return {
    years: [...new Set(dates.map((date) => date.slice(0, 4)))].sort().reverse(),
    months: [...new Set(dates.filter((date) => year === "all" || date.startsWith(`${year}-`)).map((date) => date.slice(5, 7)))].sort().reverse(),
  };
}

export function matchesDprDates(date: string, filters: DprDateFilters) {
  return (filters.year === "all" || date.slice(0, 4) === filters.year)
    && (filters.month === "all" || date.slice(5, 7) === filters.month)
    && (!filters.from || date >= filters.from)
    && (!filters.to || date <= filters.to);
}