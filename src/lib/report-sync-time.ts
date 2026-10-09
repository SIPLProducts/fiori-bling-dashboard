export type ReportDataset = "net-sales" | "open-sales-orders";

export function matchesReportEndpoint(endpoint: string, dataset: ReportDataset) {
  const normalized = endpoint.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return normalized === (dataset === "net-sales" ? "salesreportskpi" : "opensalesorders");
}

export function lastSyncedLabel(value: string | null | undefined) {
  if (!value || !Number.isFinite(Date.parse(value))) return "Sync time unavailable";
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `Last synced: ${part("day")}.${part("month")}.${part("year")}, ${part("hour")}:${part("minute")} ${part("dayPeriod").toLowerCase()} IST`;
}