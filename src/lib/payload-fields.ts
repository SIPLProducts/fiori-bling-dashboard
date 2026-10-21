/**
 * Request-payload fields for SAP API Settings, built from whatever JSON is pasted.
 * `//` lines mark optional keys that are left out of the request. Pure and browser/Node safe.
 */

export type PayloadField = { key: string; value: string; optional: boolean; date: boolean };

/** Removes `//` comment lines and trailing commas so commented SAP payloads parse as JSON. */
export function stripJsonComments(raw: string): string {
  return (raw ?? "")
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n")
    .replace(/,(\s*[}\]])/g, "$1");
}

/** Date keys: names ending _F / _T whose base looks like a SAP date (…DAT / …DATE). */
export function isPayloadDateKey(key: string): boolean {
  return /DAT[E]?_(F|T)$/i.test(key) || /^(fkdat|budat|erdat)$/i.test(key);
}

export function parsePayloadFields(raw: string): PayloadField[] | null {
  const text = (raw ?? "").trim();
  if (!text) return [];
  let active: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(stripJsonComments(text));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    active = parsed as Record<string, unknown>;
  } catch {
    return null;
  }
  const fields: PayloadField[] = [];
  const seen = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const commented = line.trim().startsWith("//");
    const m = line.match(/"([^"]+)"\s*:/);
    if (!m || seen.has(m[1])) continue;
    const key = m[1];
    if (commented && key in active) continue;
    if (!commented && !(key in active)) continue;
    const v = active[key];
    if (!commented && v !== null && typeof v === "object") continue; // nested values stay payload-only
    seen.add(key);
    fields.push({ key, value: commented ? "" : v == null ? "" : String(v), optional: commented, date: isPayloadDateKey(key) });
  }
  // Keys from single-line JSON that the line scan missed.
  for (const [key, v] of Object.entries(active)) {
    if (seen.has(key) || (v !== null && typeof v === "object")) continue;
    fields.push({ key, value: v == null ? "" : String(v), optional: false, date: isPayloadDateKey(key) });
  }
  return fields;
}

/** Writes fields back; empty optional fields stay as `//` lines so they are not sent. */
export function buildPayloadText(fields: PayloadField[]): string {
  const lines = fields.map((f) => {
    const entry = `${JSON.stringify(f.key)}: ${JSON.stringify(f.value)}`;
    return f.optional && !f.value ? { comment: true, entry } : { comment: false, entry };
  });
  const lastActive = lines.map((l) => l.comment).lastIndexOf(false);
  return ["{", ...lines.map((l, i) => (l.comment ? `//  ${l.entry}` : `  ${l.entry}${i < lastActive ? "," : ""}`)), "}"].join("\n");
}
