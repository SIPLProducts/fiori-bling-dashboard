/**
 * Maps the SAP Get_User_Management_Dropdown_RES response into
 * `public.sap_user_dropdown_masters` rows (upsert on category + code, no snapshots).
 * Browser/worker/Node safe: no imports.
 */

export type UserDropdownCategory = "plant" | "profit_center";

export type UserDropdownRow = {
  category: UserDropdownCategory;
  code: string;
  name: string | null;
  raw: Record<string, unknown>;
  source_endpoint: string;
  synced_at: string;
};

export function isUserDropdownEndpoint(endpointName: string): boolean {
  return endpointName.replace(/[^a-z0-9]/gi, "").toLowerCase().includes("usermanagementdropdown");
}

function text(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function field(raw: Record<string, unknown>, key: string): unknown {
  if (raw[key] !== undefined) return raw[key];
  const real = Object.keys(raw).find((k) => k.toLowerCase() === key.toLowerCase());
  return real ? raw[real] : undefined;
}

function list(obj: Record<string, unknown>, key: string): Record<string, unknown>[] {
  const v = field(obj, key);
  return Array.isArray(v) ? (v.filter((r) => r && typeof r === "object") as Record<string, unknown>[]) : [];
}

export function mapUserDropdownPayload(payload: unknown, endpointName: string, now = new Date()) {
  let root: Record<string, unknown> = {};
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    root = payload as Record<string, unknown>;
    const inner = field(root, "data");
    if (inner && typeof inner === "object" && !Array.isArray(inner)) root = inner as Record<string, unknown>;
  }
  const syncedAt = now.toISOString();
  const byKey = new Map<string, UserDropdownRow>();
  let received = 0;
  let invalid = 0;
  const add = (category: UserDropdownCategory, rows: Record<string, unknown>[], codeKey: string, nameKey: string) => {
    for (const raw of rows) {
      received++;
      const code = text(field(raw, codeKey));
      if (!code) { invalid++; continue; }
      byKey.set(`${category}|${code}`, {
        category, code, name: text(field(raw, nameKey)), raw, source_endpoint: endpointName, synced_at: syncedAt,
      });
    }
  };
  add("plant", list(root, "plants"), "plant", "plantName");
  add("profit_center", list(root, "profitCenters"), "profitCenter", "profitCenterName");
  const rows = [...byKey.values()];
  return { received, rows, invalid, duplicates: received - invalid - rows.length };
}

/** "1000 — Plant name" style label for dropdowns. */
export function dropdownLabel(code: string, name: string | null | undefined): string {
  return name && name !== code ? `${code} — ${name}` : code;
}
