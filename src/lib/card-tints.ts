/** Soft radiant card backgrounds shared by MM screens; theme-aware via color-mix. */
export const tintBg = (a: string, b: string) => ({
  background: `linear-gradient(180deg, color-mix(in oklab, white 14%, transparent) 0%, transparent 38%), linear-gradient(135deg, color-mix(in oklab, ${a} 30%, var(--card)) 0%, color-mix(in oklab, ${b} 24%, var(--card)) 100%)`,
  borderColor: `color-mix(in oklab, ${a} 40%, var(--border))`,
  boxShadow: `0 6px 18px -10px color-mix(in oklab, ${a} 60%, transparent), inset 0 1px 0 color-mix(in oklab, white 35%, transparent)`,
});
export const TINTS = { sky: tintBg("#38bdf8", "#2dd4bf"), peach: tintBg("#fb923c", "#a78bfa"), rose: tintBg("#f472b6", "#fda4af"), steel: tintBg("#3b82f6", "#64748b"), copper: tintBg("#c2703d", "#92400e"), teal: tintBg("#14b8a6", "#0ea5e9"), violet: tintBg("#8b5cf6", "#ec4899"), amber: tintBg("#f59e0b", "#f97316"), mint: tintBg("#10b981", "#84cc16"), neutral: tintBg("#60a5fa", "#94a3b8") };
export type Tint = keyof typeof TINTS;
