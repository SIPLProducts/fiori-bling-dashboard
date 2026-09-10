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

/** Never send an empty posting-date window: default To = today, From = today − 7 days. */
export function withPostingDates(raw: string | null | undefined): string | undefined {
  if (!raw || !raw.trim()) return raw ?? undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return raw;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return raw;
  const obj = parsed as Record<string, unknown>;
  const sapDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
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
