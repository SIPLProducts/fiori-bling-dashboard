export type ReportDataset = "net-sales" | "open-sales-orders" | "order-book" | "sit" | "sales-register";

export function matchesReportEndpoint(endpoint: string, dataset: ReportDataset) {
  const normalized = endpoint.replace(/[^a-z0-9]/gi, "").toLowerCase();
  if (dataset === "sales-register") return normalized === "salesregister";
  if (dataset === "sit") return normalized.includes("salesintransit") || normalized === "sit" || normalized === "zsit";
  return normalized === (dataset === "net-sales" ? "salesreportskpi" : dataset === "order-book" ? "orderbook" : "opensalesorders");
}

export function lastSyncedLabel(value: string | null | undefined) {
  if (!value || !Number.isFinite(Date.parse(value))) return "Sync time unavailable";
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `Last Sync: ${part("day")}.${part("month")}.${part("year")}, ${part("hour")}:${part("minute")} ${part("dayPeriod").toLowerCase()} IST`;
}
/** Compact card footer form: "Last Sync: 23.10.26, 1:20 pm" (IST). */
export function lastSyncShortLabel(value: string | null | undefined) {
  if (!value || !Number.isFinite(Date.parse(value))) return "Sync time unavailable";
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "numeric", minute: "2-digit", hour12: true,
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `Last Sync: ${part("day")}.${part("month")}.${part("year")}, ${part("hour")}:${part("minute")} ${part("dayPeriod").toLowerCase()}`;
}
