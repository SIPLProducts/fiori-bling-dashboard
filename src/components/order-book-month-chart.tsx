import { useId } from "react";
import { Bar, BarChart, Cell, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { OrderChartGradients, ORDER_CHART_COLORS } from "./order-chart-presentation";
import type { MonthSummary } from "@/lib/order-book-months";

function MonthTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: MonthSummary }> }) {
  const m = payload?.[0]?.payload;
  if (!active || !m) return null;
  return <div className="rounded-md border border-border bg-popover px-3 py-2 text-[11px] text-popover-foreground shadow-md">
    <p className="font-semibold">{m.name}</p>
    <p>Order Value: ₹{m.value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr</p>
    <p>Orders: {m.orders.toLocaleString("en-IN")}</p>
  </div>;
}

export function OrderBookMonthChart({ data, pdf = false }: { data: MonthSummary[]; pdf?: boolean }) {
  const id = useId().replace(/:/g, "");
  if (!data.length) return <p className="py-8 text-center text-xs text-muted-foreground">No order dates yet</p>;
  return <div>
    <p className="text-[10px] font-medium text-muted-foreground">Value (₹ Cr)</p>
    <div style={{ height: 250 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 18, right: 8, left: 0, bottom: 4 }}>
          {OrderChartGradients({ id: `${id}-m` })}<defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--kpi-1)" /><stop offset="100%" stopColor="var(--kpi-1)" stopOpacity={0.55} /></linearGradient></defs>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="name" interval={0} height={50} tickLine={false} tick={{ fontSize: 9, angle: -35, textAnchor: "end", fill: "var(--foreground)" } as never} />
          <YAxis width={40} tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickFormatter={(v: number) => v.toFixed(0)} />
          <Tooltip content={<MonthTooltip />} cursor={{ fill: "var(--muted)" }} />
          <Bar dataKey="value" fill={`url(#${id})`} radius={[4, 4, 0, 0]} maxBarSize={26} isAnimationActive={!pdf}>{data.map((row, index) => <Cell key={row.key} fill={`url(#${id}-m-${index % ORDER_CHART_COLORS.length})`} />)}<LabelList dataKey="value" position="top" formatter={(v: number) => v.toFixed(1)} fontSize={9} fill="var(--foreground)" /></Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>;
}
