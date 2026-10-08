/** Rounded numeric domain for each independent plant measure, never a percentage. */
export function plantChartMaximum(values: number[]): number {
  const maximum = Math.max(0, ...values);
  if (!maximum) return 1;
  const step = 10 ** Math.floor(Math.log10(maximum)) / 2;
  return Math.ceil(maximum / step) * step;
}