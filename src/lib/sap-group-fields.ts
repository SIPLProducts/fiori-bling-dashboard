/**
 * SAP sends the product group hierarchy either as MNGRP1/PCGRP1/PCGRP2/PCGRP3
 * or as MAIN_GRP/SUB_GRP/SUB_GRP2/SUB_GRP3. Both fill the same typed columns.
 */
function pick(raw: Record<string, unknown>, key: string): unknown {
  if (raw[key] !== undefined) return raw[key];
  const real = Object.keys(raw).find((k) => k.toLowerCase() === key.toLowerCase());
  return real ? raw[real] : undefined;
}

function first(raw: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = pick(raw, k);
    if (v === undefined || v === null || typeof v === "object") continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return null;
}

export function sapGroupColumns(raw: Record<string, unknown>) {
  return {
    mngrp1: first(raw, ["MNGRP1", "MAIN_GRP"]),
    pcgrp1: first(raw, ["PCGRP1", "SUB_GRP"]),
    pcgrp2: first(raw, ["PCGRP2", "SUB_GRP2"]),
    pcgrp3: first(raw, ["PCGRP3", "SUB_GRP3"]),
  };
}
