/** Rounded numeric domain for each independent plant measure, never a percentage. */
export function plantChartMaximum(values: number[]): number {
  const maximum = Math.max(0, ...values);
  if (!maximum) return 1;
  const step = 10 ** Math.floor(Math.log10(maximum)) / 2;
  return Math.ceil(maximum / step) * step;
}

const ROTATED_LABEL_CHAR_PX = 5.3; // vertical advance of one 10px glyph drawn at −45° (measured 4.9, plus headroom)
const HORIZONTAL_LABEL_CHAR_PX = 6.6; // width of one 10px glyph drawn flat on the bottom axis
const HORIZONTAL_LABEL_PAD = 10; // breathing room kept between neighbouring labels

/**
 * Bottom-axis label arrangement: short labels (a division code such as VZM) sit flat when they fit their slot,
 * longer ones fall back to the diagonal arrangement with an ellipsis and the bottom space it needs.
 */
export function plantLabelLayout(names: string[], slotWidth: number) {
  const longest = names.reduce((max, name) => Math.max(max, name.trim().length), 0);
  if (longest && longest * HORIZONTAL_LABEL_CHAR_PX + HORIZONTAL_LABEL_PAD <= slotWidth) return { chars: longest, height: 30, rotated: false };
  const chars = Math.max(4, Math.min(18, longest, Math.floor(slotWidth / 1.6) || 4));
  return { chars, height: Math.round(chars * ROTATED_LABEL_CHAR_PX) + 20, rotated: true };
}
