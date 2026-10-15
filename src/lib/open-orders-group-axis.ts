/**
 * Decimal places for the group-chart y-axis ticks.
 *
 * Recharts spreads ticks from 0 to the domain maximum, so a small maximum with
 * whole-number ticks collapses into duplicates (2, 2, 1, 1, 0). Pick just enough
 * decimals to keep neighbouring ticks distinguishable.
 */
export function groupAxisDecimals(maxValue: number) {
  const max = Number.isFinite(maxValue) ? Math.abs(maxValue) : 0;
  const step = max / 4;
  if (step >= 1) return 0;
  if (step >= 0.1) return 1;
  return 2;
}
