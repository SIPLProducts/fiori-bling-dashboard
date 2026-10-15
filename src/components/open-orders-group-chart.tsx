import { useId } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { GroupSummary } from "@/lib/open-orders-groups";
import { groupAxisDecimals } from "@/lib/open-orders-group-axis";

const cr = (v: number) => v.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });

function GroupTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: GroupSummary }> }) {
  const g = payload?.[0]?.payload;
  if (!active || !g) return null;
  return <div className="rounded-md border border-border bg-popover px-3 py-2 text-[11px] text-popover-foreground shadow-md">
    <p className="font-semibold">{g.name}</p>
    <p>Division: {g.divisions.length ? g.divisions.join(", ") : "—"}</p>
    <p>Open Orders: {g.orders.toLocaleString("en-IN")}</p>
    <p>Open Value: ₹{cr(g.value)} Cr</p>
  </div>;
}

export function OpenOrdersGroupChart({ data, color, pdf = false }: { data: GroupSummary[]; color: string; pdf?: boolean }) {
  const id = useId().replace(/:/g, "");
  const rows = pdf ? data : data.slice(0, 10);
  const decimals = groupAxisDecimals(Math.max(0, ...rows.map((row) => Math.abs(Number(row.value) || 0))));
  if (!rows.length) return <p className="py-8 text-center text-xs text-muted-foreground">No group data from SAP yet</p>;
  return <div>
    <p className="text-[10px] font-medium text-muted-foreground">Value (₹ Cr)</p>
    <div style={{ height: 250 }}>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} margin={{ top: 18, right: 10, left: 0, bottom: 4 }}>
        <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={1} /><stop offset="100%" stopColor={color} stopOpacity={0.55} /></linearGradient></defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="name" interval={0} height={70} tickLine={false} tick={({ x, y, payload }) => { const s = String(payload.value); return <g transform={`translate(${x},${y})`}><title>{s}</title><text transform="translate(0,8) rotate(-40)" textAnchor="end" fontSize={10} fill="var(--foreground)">{s.length > 14 ? `${s.slice(0, 14)}…` : s}</text></g>; }} />
        <YAxis tickFormatter={(v: number) => v.toLocaleString("en-IN", { maximumFractionDigits: 0 })} width={44} tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} />
        <Tooltip content={<GroupTooltip />} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="value" fill={`url(#${id})`} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={!pdf}><LabelList dataKey="value" position="top" formatter={(v: number) => v.toFixed(2)} fontSize={9} fill="var(--foreground)" /></Bar>
      </BarChart>
    </ResponsiveContainer>
    </div>
  </div>;
}
