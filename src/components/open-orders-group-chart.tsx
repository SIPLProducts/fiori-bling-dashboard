import { useId } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { GroupSummary } from "@/lib/open-orders-groups";

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
  if (!rows.length) return <p className="py-8 text-center text-xs text-muted-foreground">No group data from SAP yet</p>;
  return <div style={{ height: Math.max(180, rows.length * 26 + 30) }}>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
        <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={color} stopOpacity={0.55} /><stop offset="100%" stopColor={color} stopOpacity={1} /></linearGradient></defs>
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis type="number" tickFormatter={cr} tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} />
        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10, fill: "var(--foreground)" }} interval={0} />
        <Tooltip content={<GroupTooltip />} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="value" fill={`url(#${id})`} radius={[0, 4, 4, 0]} barSize={14} isAnimationActive={!pdf} />
      </BarChart>
    </ResponsiveContainer>
  </div>;
}
