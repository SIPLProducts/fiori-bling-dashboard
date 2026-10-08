import { useEffect, useMemo, useRef, useState } from "react";
import { Bar, ComposedChart, Line, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PlantPending } from "@/lib/open-sales-orders-plants";
import { plantChartMaximum } from "@/lib/plant-chart-scale";

const numeric = (value: number) => value.toLocaleString("en-IN", { maximumFractionDigits: 3 });
const measures = [
  { key: "value", label: "Pending Value (₹ Cr)", color: "var(--chart-1)", className: "text-chart-1", format: (n: number) => n.toFixed(2) },
  { key: "quantity", label: "Pending Quantity", color: "var(--chart-2)", className: "text-chart-2", format: numeric },
  { key: "count", label: "Open Order Lines", color: "var(--chart-4)", className: "text-chart-4", format: numeric },
] as const;

export function PlantPendingChart({ plants, loading }: { plants: PlantPending[]; loading: boolean }) {
  const maxima = useMemo(() => ({
    value: plantChartMaximum(plants.map((plant) => plant.value)),
    quantity: plantChartMaximum(plants.map((plant) => plant.quantity)),
    count: plantChartMaximum(plants.map((plant) => plant.count)),
  }), [plants]);
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const capacity = Math.max(2, Math.floor((width - 105) / 70));
  const rows: PlantPending[][] = [];
  for (let start = 0; start < plants.length; start += capacity) rows.push(plants.slice(start, start + capacity));
  return <div ref={container} className="min-w-0" aria-label="Plant-wise Pending chart">
    <div className="mb-1 flex flex-wrap justify-end gap-x-4 gap-y-1 text-xs">
      {measures.filter((metric) => metric.key !== "quantity").map((metric) => <span key={metric.key} className={`flex items-center gap-2 ${metric.className}`}><span className="size-2.5 rounded-sm bg-current" />{metric.label}</span>)}
    </div>
    {plants.length ? <div className="min-w-0">
      {rows.map((data, rowIndex) => <div key={rowIndex} className="min-w-0" data-plant-chart-row>
        <div className="flex justify-between text-[10px] font-medium">
          <span className="text-chart-1">Value (₹ Cr)</span>
          <span className="text-chart-4">Order Lines</span>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart data={data} barCategoryGap="35%" margin={{ top: 30, right: 4, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid-line)" strokeDasharray="3 3" />
            <XAxis dataKey="code" interval={0} height={48} axisLine={{ stroke: "var(--chart-axis-label)" }} tickLine={false} tick={({ x, y, payload }) => {
              const plant = data.find((item) => item.code === payload.value);
              const labelWidth = Math.max(40, (width - 100) / data.length - 6);
              return <g transform={`translate(${x},${y})`}><text textAnchor="middle" y={12} className="fill-foreground text-[11px] font-semibold">{plant?.code || "—"}</text><foreignObject x={-labelWidth / 2} y={18} width={labelWidth} height={30}><div className="line-clamp-2 break-words text-center text-[9px] leading-3 text-muted-foreground" title={plant?.name}>{plant?.name || "Unassigned"}</div></foreignObject></g>;
            }} />
            <YAxis yAxisId="value" domain={[0, maxima.value]} ticks={[0, 0.25, 0.5, 0.75, 1].map((part) => part * maxima.value)} width={52} tick={{ fontSize: 10, fill: "var(--chart-1)" }} tickFormatter={numeric} tickLine={false} axisLine={{ stroke: "var(--chart-axis-label)" }} />
            <YAxis yAxisId="count" orientation="right" domain={[0, maxima.count]} ticks={[0, 0.25, 0.5, 0.75, 1].map((part) => Math.round(part * maxima.count))} width={40} tick={{ fontSize: 10, fill: "var(--chart-4)" }} tickFormatter={numeric} tickLine={false} axisLine={{ stroke: "var(--chart-axis-label)" }} />
            <Tooltip cursor={{ fill: "var(--chart-hover-fill)" }} content={({ active, payload }) => {
              const plant = payload?.[0]?.payload as PlantPending | undefined;
              return active && plant ? <div className="max-w-64 rounded-md border border-border bg-popover p-2 text-xs text-popover-foreground shadow-tile"><p className="mb-1 font-semibold">{plant.code || "—"} — {plant.name || "Unassigned"}</p>{measures.map((metric) => <p key={metric.key} className={metric.className}>{metric.label}: {metric.format(plant[metric.key])}</p>)}</div> : null;
            }} />
            <Bar yAxisId="value" dataKey="value" name="Pending Value (₹ Cr)" fill="var(--chart-1)" maxBarSize={30} radius={[2, 2, 0, 0]} isAnimationActive={false}>
              <LabelList dataKey="value" position="top" offset={6} formatter={(n: number) => n.toFixed(2)} className="fill-chart-1 text-[10px] font-medium" />
            </Bar>
            <Line yAxisId="count" dataKey="count" name="Open Order Lines" type="linear" stroke="var(--chart-4)" strokeWidth={2} dot={{ r: 3, fill: "var(--chart-4)" }} activeDot={{ r: 5 }} isAnimationActive={false}>
              <LabelList dataKey="count" position="top" offset={23} formatter={numeric} className="fill-chart-4 text-[10px] font-semibold" />
            </Line>
          </ComposedChart>
        </ResponsiveContainer>
      </div>)}
    </div> : <p className="py-6 text-center text-sm text-muted-foreground">{loading ? "Loading plants…" : "No pending orders match the selected filters."}</p>}
    <div className="mt-1 grid grid-cols-1 divide-y divide-border rounded-md border border-border bg-muted/40 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {measures.map((metric) => <div key={metric.key} className="px-3 py-2"><p className="text-[10px] text-muted-foreground">Total {metric.label}</p><p data-plant-total={metric.key} className={`mt-1 text-base font-semibold tabular-nums ${metric.className}`}>{metric.key === "value" ? "₹ " : ""}{metric.format(plants.reduce((sum, plant) => sum + plant[metric.key], 0))}{metric.key === "value" ? " Cr" : ""}</p></div>)}
    </div>
  </div>;
}