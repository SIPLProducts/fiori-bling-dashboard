const IST_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

/** Format a timestamp in Indian Standard Time, e.g. "01-09-2026, 11:17 am". */
export function formatDateTimeIST(value: string | number | Date | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return IST_FORMATTER.format(date).replace(/\//g, "-");
}

/** Same as formatDateTimeIST but suffixed with "IST" for unambiguous display. */
export function formatDateTimeISTLabel(value: string | number | Date | null | undefined): string {
  const formatted = formatDateTimeIST(value);
  return formatted === "—" ? formatted : `${formatted} IST`;
}
