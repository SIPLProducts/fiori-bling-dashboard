/** Rounded numeric domain for each independent plant measure, never a percentage. */
export function plantChartMaximum(values: number[]): number {
  const maximum = Math.max(0, ...values);
  if (!maximum) return 1;
  const step = 10 ** Math.floor(Math.log10(maximum)) / 2;
  return Math.ceil(maximum / step) * step;
}

const ROTATED_LABEL_CHAR_PX = 4.7; // vertical advance of one 10px glyph drawn at −45°

/** Diagonal plant-name axis: characters shown before an ellipsis, and the bottom space those labels need. */
export function plantLabelLayout(names: string[], slotWidth: number) {
  const longest = names.reduce((max, name) => Math.max(max, name.trim().length), 0);
  const chars = Math.max(4, Math.min(16, longest, Math.floor(slotWidth / 2.4) || 4));
  return { chars, height: Math.round(chars * ROTATED_LABEL_CHAR_PX) + 16 };
}