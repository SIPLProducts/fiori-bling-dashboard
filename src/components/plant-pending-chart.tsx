import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PlantPending } from "@/lib/open-sales-orders-plants";

const numeric = (value: number) => value.toLocaleString("en-IN", { maximumFractionDigits: 3 });
const measures = [
  { key: "value", label: "Pending Value (₹ Cr)", color: "var(--chart-1)", className: "text-chart-1", format: (n: number) => n.toFixed(2) },
  { key: "quantity", label: "Pending Quantity", color: "var(--chart-2)", className: "text-chart-2", format: numeric },
  { key: "count", label: "Open Order Lines", color: "var(--chart-4)", className: "text-chart-4", format: numeric },
] as const;

export function PlantPendingChart({ plants, loading }: { plants: PlantPending[]; loading: boolean }) {
  const data = useMemo(() => {
    const max = { value: 0, quantity: 0, count: 0 };
    for (const plant of plants) for (const metric of measures) max[metric.key] = Math.max(max[metric.key], plant[metric.key]);
    return plants.map((plant) => ({ ...plant, valueRelative: max.value ? plant.value / max.value * 100 : 0, quantityRelative: max.quantity ? plant.quantity / max.quantity * 100 : 0, countRelative: max.count ? plant.count / max.count * 100 : 0 }));
  }, [plants]);
  return <div aria-label="Plant-wise Pending chart">
    <div className="mb-3 flex flex-wrap justify-end gap-x-5 gap-y-2 text-xs">
      {measures.map((metric) => <span key={metric.key} className={`flex items-center gap-2 ${metric.className}`}><span className="size-2.5 rounded-sm bg-current" />{metric.label}</span>)}
    </div>
    {plants.length ? <div className="overflow-x-auto">
      <div style={{ minWidth: Math.max(620, plants.length * 140 + 90) }}>
        <ResponsiveContainer width="100%" height={330}>
          <BarChart data={data} barGap={3} barCategoryGap="24%" margin={{ top: 48, right: 22, left: 22, bottom: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid-line)" strokeDasharray="3 3" />
            <XAxis dataKey="code" interval={0} height={64} tick={({ x, y, payload }) => {
              const plant = data.find((item) => item.code === payload.value);
              return <g transform={`translate(${x},${y})`}><text textAnchor="middle" y={12} className="fill-foreground text-[11px] font-semibold">{plant?.code || "—"}</text><foreignObject x={-70} y={18} width={140} height={38}><div className="text-center text-[10px] leading-4 text-muted-foreground" title={plant?.name}>{plant?.name || "Unassigned"}</div></foreignObject></g>;
            }} tickLine={false} />
            <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(n) => `${n}%`} tick={{ fontSize: 10 }} width={52} label={{ value: "Relative to Largest Plant (%)", angle: -90, position: "insideLeft", fontSize: 10, fill: "var(--chart-axis-label)" }} />
            <Tooltip cursor={{ fill: "var(--chart-hover-fill)" }} content={({ active, payload }) => {
              const plant = payload?.[0]?.payload as PlantPending | undefined;
              return active && plant ? <div className="rounded-md border border-border bg-popover p-3 text-xs text-popover-foreground shadow-tile"><p className="mb-2 font-semibold">{plant.code || "—"} — {plant.name || "Unassigned"}</p>{measures.map((metric) => <p key={metric.key} className={metric.className}>{metric.label}: {metric.format(plant[metric.key])}</p>)}</div> : null;
            }} />
            {measures.map((metric, index) => <Bar key={metric.key} dataKey={`${metric.key}Relative`} name={metric.label} fill={metric.color} maxBarSize={27} radius={[2, 2, 0, 0]} isAnimationActive={false}>
              <LabelList dataKey={metric.key} position="top" offset={6 + index * 12} formatter={metric.format} className={`${metric.className} fill-current text-[9px] font-medium`} />
            </Bar>)}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div> : <p className="py-12 text-center text-sm text-muted-foreground">{loading ? "Loading plants…" : "No pending orders match the selected filters."}</p>}
    <div className="mt-3 grid grid-cols-1 divide-y divide-border rounded-md border border-border bg-muted/40 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {measures.map((metric) => <div key={metric.key} className="px-4 py-3"><p className="text-[10px] text-muted-foreground">Total {metric.label}</p><p data-plant-total={metric.key} className={`mt-1 text-base font-semibold tabular-nums ${metric.className}`}>{metric.key === "value" ? "₹ " : ""}{metric.format(plants.reduce((sum, plant) => sum + plant[metric.key], 0))}{metric.key === "value" ? " Cr" : ""}</p></div>)}
    </div>
  </div>;
}