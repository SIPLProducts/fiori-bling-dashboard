import { RADIANT_COLORS } from "@/lib/radiant";

/** Horizontal soft→strong gradients for Recharts bars; use fill={radiantFill(i)}. */
export function RadiantDefs() {
  return (
    <defs>
      {RADIANT_COLORS.map((c, i) => (
        <linearGradient key={c} id={`radiant-h-${i}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={c} stopOpacity={0.6} />
          <stop offset="100%" stopColor={c} stopOpacity={1} />
        </linearGradient>
      ))}
    </defs>
  );
}

export function radiantFill(i: number) {
  return `url(#radiant-h-${i % RADIANT_COLORS.length})`;
}
