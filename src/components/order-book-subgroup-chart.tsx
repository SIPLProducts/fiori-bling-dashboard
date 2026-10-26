import { useId } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { GroupDivisionSummary } from "@/lib/open-orders-groups";

const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--quick-view-violet)", "var(--kpi-6)", "var(--success)", "var(--warning)", "var(--primary)"];
const cr = (v: number) => v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Row = Record<string, number | string>;

function SubTooltip({ active, payload, colors, label, unit = "orders" }: { active?: boolean; payload?: Array<{ dataKey?: string | number; payload: Row & { __g: GroupDivisionSummary } }>; colors: Map<string, string>; label: string; unit?: string }) {
  const g = payload?.[0]?.payload.__g as GroupDivisionSummary | undefined;
  if (!active || !g) return null;
  const parts = Object.entries(g.parts).sort((a, b) => b[1].value - a[1].value);
  return <div className="max-w-xs rounded-md border border-border bg-popover px-3 py-2 text-[11px] text-popover-foreground shadow-md">
    <p className="font-semibold">{label}: {g.name}</p>
    {parts.map(([d, p]) => <p key={d} className="mt-0.5 flex items-center gap-1.5 text-muted-foreground"><span className="size-2.5 shrink-0 rounded-sm" style={{ background: colors.get(d) }} />{d}: ₹{cr(p.value)} Cr · {p.orders.toLocaleString("en-IN")} {unit}</p>)}
    <p className="mt-1 font-medium">Total: ₹{cr(g.value)} Cr · {g.orders.toLocaleString("en-IN")} {unit}</p>
  </div>;
}

/** Order Book group chart: one stacked bar per group, split by division with radiant colours. Colours follow the order of `divisions`. */
export function OrderBookSubGroupChart({ groups, divisions, pdf = false, groupLabel = "Sub Group", sit = false }: { sit?: boolean; groups: GroupDivisionSummary[]; divisions: string[]; pdf?: boolean; groupLabel?: string }) {
  const id = useId().replace(/:/g, "");
  const rows = pdf ? groups : groups.slice(0, 10);
  if (!rows.length) return <p className="py-8 text-center text-xs text-muted-foreground">No group data from SAP yet</p>;
  const used = divisions.filter((d) => rows.some((g) => g.parts[d]));
  const colors = new Map(used.map((d) => [d, PALETTE[divisions.indexOf(d) % PALETTE.length]!]));
  const data: Row[] = rows.map((g) => ({ name: g.name, total: g.value, __g: g as unknown as number, ...Object.fromEntries(used.map((d) => [d, g.parts[d]?.value ?? 0])) }));
  return <div>
    <p className="text-[10px] font-medium text-muted-foreground">Value (₹ Cr)</p>
    <div style={{ height: 290 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 18, right: 10, left: 0, bottom: 4 }}>
          <defs>{used.map((d, i) => { const c = colors.get(d)!; return <linearGradient key={d} id={`${id}-${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`color-mix(in oklab, ${c} 55%, var(--background))`} />
            <stop offset="45%" stopColor={c} />
            <stop offset="100%" stopColor={`color-mix(in oklab, ${c} 75%, var(--foreground))`} />
          </linearGradient>; })}</defs>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="name" interval={0} height={70} tickLine={false} tick={({ x, y, payload }) => { const s = String(payload.value); return <g transform={`translate(${x},${y})`}><title>{s}</title><text transform="translate(0,8) rotate(-40)" textAnchor="end" fontSize={10} fill="var(--foreground)">{s.length > 14 ? `${s.slice(0, 14)}…` : s}</text></g>; }} />
          <YAxis tickFormatter={(v: number) => v.toLocaleString("en-IN", { maximumFractionDigits: 0 })} width={44} tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} />
          <Tooltip content={<SubTooltip unit={sit ? "SIT invoices" : "orders"} colors={colors} label={groupLabel} />} cursor={{ fill: "var(--muted)" }} />
          {used.map((d, i) => <Bar key={d} dataKey={d} name={d} stackId="div" fill={`url(#${id}-${i})`} maxBarSize={32} isAnimationActive={!pdf} {...(i === used.length - 1 ? { radius: [4, 4, 0, 0] as [number, number, number, number] } : {})}>
            {i === used.length - 1 ? <LabelList dataKey="total" position="top" formatter={(v: number) => Number(v).toFixed(2)} fontSize={9} fill="var(--foreground)" /> : null}
          </Bar>)}
          <Legend verticalAlign="bottom" content={() => <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-2 pt-2 text-[10px] text-muted-foreground"><span className="font-semibold text-foreground">Division</span>{used.map((d) => <span key={d} className="inline-flex items-center gap-1"><span className="size-2.5 rounded-sm" style={{ background: colors.get(d) }} />{d}</span>)}</div>} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>;
}
