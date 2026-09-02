/**
 * Small helpers for the scheduler UI: presets, validation, a plain-English
 * description and the next run times for a standard 5-field cron expression.
 */

export type CronPreset = { label: string; expression: string };

export const CRON_PRESETS: CronPreset[] = [
  { label: "Every 5 minutes", expression: "*/5 * * * *" },
  { label: "Every 10 minutes", expression: "*/10 * * * *" },
  { label: "Every 15 minutes", expression: "*/15 * * * *" },
  { label: "Every 30 minutes", expression: "*/30 * * * *" },
  { label: "Every hour", expression: "0 * * * *" },
  { label: "Every 6 hours", expression: "0 */6 * * *" },
  { label: "Every day (00:00 UTC)", expression: "0 0 * * *" },
  { label: "Every week (Sunday 00:00 UTC)", expression: "0 0 * * 0" },
];

export function normalizeCron(expression: string): string {
  return expression.trim().replace(/\s+/g, " ");
}

export function isValidCron(expression: string): boolean {
  const parts = normalizeCron(expression).split(" ");
  if (parts.length !== 5) return false;
  const ranges: [number, number][] = [
    [0, 59],
    [0, 23],
    [1, 31],
    [1, 12],
    [0, 7],
  ];
  return parts.every((part, i) => {
    const range = ranges[i]!;
    return part.split(",").every((chunk) => {
      const [spec, stepRaw] = chunk.split("/");
      if (stepRaw !== undefined && !/^\d+$/.test(stepRaw)) return false;
      if (spec === "*") return true;
      const m = /^(\d+)(?:-(\d+))?$/.exec(spec ?? "");
      if (!m) return false;
      const from = Number(m[1]);
      const to = m[2] === undefined ? from : Number(m[2]);
      return from >= range[0] && to <= range[1] && from <= to;
    });
  });
}

function expand(part: string, min: number, max: number): number[] {
  const values = new Set<number>();
  for (const chunk of part.split(",")) {
    const [spec, stepRaw] = chunk.split("/");
    const step = stepRaw ? Number(stepRaw) : 1;
    let from = min;
    let to = max;
    if (spec !== "*") {
      const m = /^(\d+)(?:-(\d+))?$/.exec(spec ?? "");
      if (!m) continue;
      from = Number(m[1]);
      to = m[2] === undefined ? (stepRaw ? max : from) : Number(m[2]);
    }
    for (let v = from; v <= to; v += step) values.add(v);
  }
  return [...values].sort((a, b) => a - b);
}

/** Next `count` run times (UTC-based cron, returned as Date objects). */
export function nextCronRuns(expression: string, count = 3, from: Date = new Date()): Date[] {
  if (!isValidCron(expression)) return [];
  const [min, hour, dom, mon, dowRaw] = normalizeCron(expression).split(" ") as [
    string,
    string,
    string,
    string,
    string,
  ];
  const minutes = expand(min, 0, 59);
  const hours = expand(hour, 0, 23);
  const doms = expand(dom, 1, 31);
  const months = expand(mon, 1, 12);
  const dows = expand(dowRaw, 0, 7).map((d) => (d === 7 ? 0 : d));

  const out: Date[] = [];
  const cursor = new Date(from.getTime());
  cursor.setUTCSeconds(0, 0);
  cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);

  // Scan minute by minute for up to one year.
  for (let i = 0; i < 366 * 24 * 60 && out.length < count; i += 1) {
    const domOk = dom === "*" || doms.includes(cursor.getUTCDate());
    const dowOk = dowRaw === "*" || dows.includes(cursor.getUTCDay());
    if (
      minutes.includes(cursor.getUTCMinutes()) &&
      hours.includes(cursor.getUTCHours()) &&
      months.includes(cursor.getUTCMonth() + 1) &&
      (dom === "*" || dowRaw === "*" ? domOk && dowOk : domOk || dowOk)
    ) {
      out.push(new Date(cursor.getTime()));
    }
    cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);
  }
  return out;
}

/** Plain-English summary, e.g. "Runs every 5 minutes". */
export function describeCron(expression: string): string {
  const norm = normalizeCron(expression);
  if (!isValidCron(norm)) return "Not a valid 5-field cron expression";
  const preset = CRON_PRESETS.find((p) => p.expression === norm);
  if (preset) return `Runs ${preset.label.toLowerCase()}`;
  const [min, hour, dom, mon, dow] = norm.split(" ") as [string, string, string, string, string];
  const every = /^\*\/(\d+)$/.exec(min);
  if (every && hour === "*" && dom === "*" && mon === "*" && dow === "*") {
    return `Runs every ${every[1]} minutes`;
  }
  const everyHour = /^\*\/(\d+)$/.exec(hour);
  if (/^\d+$/.test(min) && everyHour && dom === "*" && mon === "*" && dow === "*") {
    return `Runs every ${everyHour[1]} hours at minute ${min}`;
  }
  if (/^\d+$/.test(min) && /^\d+$/.test(hour) && dom === "*" && mon === "*" && dow === "*") {
    return `Runs daily at ${hour.padStart(2, "0")}:${min.padStart(2, "0")} UTC`;
  }
  return `Runs on schedule ${norm}`;
}
