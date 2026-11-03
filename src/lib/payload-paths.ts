/** Pure helpers to read/write top-level or nested keys (e.g. DOCUMENT_DATE.FROM_DATE) in a JSON payload text without flattening nested objects. */
import { stripJsonComments } from "./payload-fields";

function parseObject(text: string): Record<string, unknown> | null {
  const t = (text ?? "").trim();
  if (!t) return {};
  try {
    const v: unknown = JSON.parse(stripJsonComments(t));
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function getPayloadPath(text: string, path: string): string {
  let cur: unknown = parseObject(text);
  for (const part of path.split(".")) {
    if (!cur || typeof cur !== "object") return "";
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur === null || cur === undefined || typeof cur === "object" ? "" : String(cur);
}

/** Returns updated JSON text, or null when the payload is not valid JSON. Other keys (nested included) are preserved. */
export function setPayloadPaths(text: string, values: Record<string, string>): string | null {
  const obj = parseObject(text);
  if (!obj) return null;
  for (const [path, value] of Object.entries(values)) {
    const parts = path.split(".");
    let cur: Record<string, unknown> = obj;
    for (const part of parts.slice(0, -1)) {
      const nxt = cur[part];
      cur[part] = nxt && typeof nxt === "object" && !Array.isArray(nxt) ? { ...(nxt as Record<string, unknown>) } : {};
      cur = cur[part] as Record<string, unknown>;
    }
    cur[parts[parts.length - 1] ?? path] = value;
  }
  return JSON.stringify(obj, null, 2);
}
