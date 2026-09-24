const hashName = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

/** A stable, light chart color derived from the data label itself. */
export function dynamicChartColor(name: string) {
  const hash = hashName(name.trim().toUpperCase() || "UNASSIGNED");
  const hue = hash % 360;
  const chroma = 0.12 + ((hash >>> 9) % 5) * 0.008;
  const lightness = 0.66 + ((hash >>> 16) % 4) * 0.018;
  return `oklch(${lightness.toFixed(3)} ${chroma.toFixed(3)} ${hue})`;
}

export function buildDynamicColorMap(names: string[]) {
  return new Map(names.map((name) => [name, dynamicChartColor(name)]));
}