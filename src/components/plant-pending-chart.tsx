import { useId, useMemo } from "react";
import { Bar, BarChart, Cell, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PlantPending } from "@/lib/open-sales-orders-plants";
import { plantChartMaximum } from "@/lib/plant-chart-scale";

import { OrderChartGradients, ORDER_CHART_COLORS, useChartWidth } from "@/components/order-chart-presentation";

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
  const { ref: container, width } = useChartWidth();
  const gradient = useId().replace(/:/g, "");
  const slotWidth = Math.max(1, (width - 48) / Math.max(1, plants.length));
  const barWidth = Math.max(3, Math.min(22, slotWidth * 0.7));
  return <div ref={container} className="min-w-0" aria-label="Plant-wise Pending chart">
    {plants.length ? <div className="min-w-0">
      <div className="min-w-0" data-plant-chart-row>
        <div className="flex justify-between text-[10px] font-medium">
          <span className="text-chart-1">Value (₹ Cr)</span>

        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={plants} barCategoryGap="15%" margin={{ top: 22, right: 0, left: 0, bottom: 0 }}>
            {OrderChartGradients({ id: gradient })}
            <CartesianGrid vertical={false} stroke="var(--chart-grid-line)" strokeDasharray="3 3" />
            <XAxis dataKey="code" interval={0} height={48} padding={{ left: 0, right: 0 }} axisLine={{ stroke: "var(--chart-axis-label)" }} tickLine={false} tick={({ x, y, payload }) => {
              const plant = plants.find((item) => item.code === payload.value);
              const dense = slotWidth < 36;
              return <g transform={`translate(${x},${y})`}><text textAnchor={dense ? "end" : "middle"} transform={dense ? "translate(0,10) rotate(-45)" : "translate(0,12)"} className="fill-foreground text-[9px] font-semibold">{plant?.code || "—"}</text></g>;
            }} />
            <YAxis yAxisId="value" domain={[0, maxima.value]} ticks={[0, 0.25, 0.5, 0.75, 1].map((part) => part * maxima.value)} width={48} tick={{ fontSize: 10, fill: "var(--chart-1)" }} tickFormatter={numeric} tickLine={false} axisLine={{ stroke: "var(--chart-axis-label)" }} />
            <Tooltip cursor={{ fill: "var(--chart-hover-fill)" }} content={({ active, payload }) => {
              const plant = payload?.[0]?.payload as PlantPending | undefined;
              return active && plant ? <div className="max-w-64 rounded-md border border-border bg-popover p-2 text-xs text-popover-foreground shadow-tile"><p className="mb-1 font-semibold">{plant.code || "—"} — {plant.name || "Unassigned"}</p>{measures.map((metric) => <p key={metric.key} className={metric.className}>{metric.label}: {metric.format(plant[metric.key])}</p>)}</div> : null;
            }} />
            <Bar yAxisId="value" dataKey="value" name="Pending Value (₹ Cr)" fill="var(--chart-1)" barSize={barWidth} radius={[2, 2, 0, 0]} isAnimationActive={false}>
              {plants.map((plant, index) => <Cell key={plant.code} fill={`url(#${gradient}-${index % ORDER_CHART_COLORS.length})`} />)}
              <LabelList dataKey="value" position="top" angle={slotWidth < 30 ? -45 : 0} offset={6} formatter={(n: number) => n.toFixed(2)} className="fill-chart-1 text-[10px] font-medium" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div> : <p className="py-6 text-center text-sm text-muted-foreground">{loading ? "Loading plants…" : "No pending orders match the selected filters."}</p>}
    <div className="mt-1 grid grid-cols-1 divide-y divide-border rounded-md border border-border bg-muted/40 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {measures.map((metric) => <div key={metric.key} className="px-2 py-1"><p className="text-[10px] text-muted-foreground">Total {metric.label}</p><p data-plant-total={metric.key} className={`mt-0.5 text-sm font-semibold tabular-nums ${metric.className}`}>{metric.key === "value" ? "₹ " : ""}{metric.format(plants.reduce((sum, plant) => sum + plant[metric.key], 0))}{metric.key === "value" ? " Cr" : ""}</p></div>
    </div>
  </div>;
}