/** Shared per-row palette for ranking cards (matches the Sales Register look). */
export const RADIANT_COLORS = ["#1f6fd1", "#0f9d8a", "#2e8b57", "#e08a1e", "#8e44ad", "#d64550", "#3a8dde", "#16a3b8", "#c0841a", "#5c6bc0"];

export function radiantColor(i: number): string {
  return RADIANT_COLORS[((i % RADIANT_COLORS.length) + RADIANT_COLORS.length) % RADIANT_COLORS.length] ?? "#1f6fd1";
}

export function radiantBar(i: number): string {
  const c = radiantColor(i);
  return `linear-gradient(90deg, ${c}99, ${c})`;
}
