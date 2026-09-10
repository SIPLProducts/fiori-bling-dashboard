/**
 * Client-safe helpers shared by the server-side SAP pull and the static-build
 * browser sync. Pure functions only — no Supabase admin client, no env reads.
 */

/**
 * Recovers the complete objects of a JSON array that was cut mid-document
 * (an older middleware build truncates responses). Scans with string/escape
 * awareness so a cut inside a quoted value cannot corrupt the salvage.
 */
export function salvageTruncatedArray(text: string): unknown[] | null {
  const trimmed = text.trimStart();
  if (!trimmed.startsWith("[")) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  let lastComplete = -1;
  for (let i = 0; i < trimmed.length; i += 1) {
    const ch = trimmed[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      if (inString) escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{" || ch === "[") depth += 1;
    else if (ch === "}" || ch === "]") {
      depth -= 1;
      if (depth === 1) lastComplete = i;
    }
  }
  if (lastComplete < 0) return null;
  try {
    const rows = JSON.parse(`${trimmed.slice(0, lastComplete + 1)}]`) as unknown[];
    return Array.isArray(rows) && rows.length ? rows : null;
  } catch {
    return null;
  }
}

/**
 * When the middleware's own JSON envelope is cut mid-document, the SAP payload
 * still sits inside its `"body":"..."` string. Extract and unescape it so the
 * salvage above can run on the array itself.
 */
export function extractEmbeddedBody(text: string): string | null {
  const marker = '"body":"';
  const start = text.indexOf(marker);
  if (start < 0) return null;
  const raw = text.slice(start + marker.length);
  try {
    // Close the string so JSON.parse can unescape it; drop a dangling escape.
    const safe = raw.replace(/\\$/, "");
    return JSON.parse(`"${safe.replace(/"$/, "")}"`) as string;
  } catch {
    // Unescape manually as a last resort.
    return raw
      .replace(/\\"/g, '"')
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\\\/g, "\\");
  }
}

/** Posting-date window options saved on each endpoint. */
export type PostingRange = "last7d" | "last1m" | "last6m" | "last1y" | "custom";

export const POSTING_RANGES: { value: PostingRange; label: string }[] = [
  { value: "last7d", label: "Last 7 days" },
  { value: "last1m", label: "Last 1 month" },
  { value: "last6m", label: "Last 6 months" },
  { value: "last1y", label: "Last 1 year" },
  { value: "custom", label: "Custom dates" },
];

const sapDateOf = (d: Date) =>
  `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;

/**
 * Computes the posting window for a preset at the moment of the call:
 * To = today, From = today minus the chosen span. Returns null for `custom`,
 * meaning the dates stored in the payload are used unchanged.
 */
export function postingWindow(range: string | null | undefined, now: Date = new Date()): { from: string; to: string } | null {
  const to = new Date(now);
  const from = new Date(now);
  switch (range) {
    case "last7d":
      from.setDate(from.getDate() - 7);
      break;
    case "last1m":
      from.setMonth(from.getMonth() - 1);
      break;
    case "last6m":
      from.setMonth(from.getMonth() - 6);
      break;
    case "last1y":
      from.setFullYear(from.getFullYear() - 1);
      break;
    default:
      return null;
  }
  return { from: sapDateOf(from), to: sapDateOf(to) };
}

/**
 * Ensures BUDAT_F / BUDAT_T in the payload. With a preset `range` the window
 * is recomputed for every call, so a scheduled endpoint always follows today;
 * with `custom` the saved dates are kept and only empty/invalid ones default
 * to To = today, From = today − 7 days.
 */
export function withPostingDates(raw: string | null | undefined, range?: string | null): string | undefined {
  if (!raw || !raw.trim()) return raw ?? undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return raw;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return raw;
  const obj = parsed as Record<string, unknown>;
  const window = postingWindow(range);
  if (window) {
    if ("BUDAT_F" in obj) obj["BUDAT_F"] = window.from;
    if ("BUDAT_T" in obj) obj["BUDAT_T"] = window.to;
    return JSON.stringify(obj);
  }
  const sapDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return sapDateOf(d);
  };
  const valid = (v: unknown) => /^\d{8}$/.test(String(v ?? "").trim());
  if ("BUDAT_F" in obj && !valid(obj["BUDAT_F"])) obj["BUDAT_F"] = sapDate(7);
  if ("BUDAT_T" in obj && !valid(obj["BUDAT_T"])) obj["BUDAT_T"] = sapDate(0);
  return JSON.stringify(obj);
}

/** Turns the stored `[{key,value}]` rows into a plain object. */
export function keyValueObject(raw: unknown): Record<string, string> {
  return Array.isArray(raw)
    ? Object.fromEntries(
        (raw as { key?: unknown; value?: unknown }[])
          .filter((r) => r && typeof r === "object" && String(r.key ?? "").trim())
          .map((r) => [String(r.key), String(r.value ?? "")]),
      )
    : {};
}

/** Human-readable byte size for run messages. */
export function formatBytes(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

/** True when this bundle is the on-prem static SPA build (no app server). */
export const IS_STATIC_BUILD = import.meta.env["VITE_STATIC_BUILD"] === "1";

/** Same-origin Nginx bridge that injects the middleware shared secret. */
export const STATIC_MIDDLEWARE_BASE = "/sap-mw";
