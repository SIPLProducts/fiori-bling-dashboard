import { useState } from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";
import {
  CHART_COLORS,
  customerData,
  mainGroupData,
  paretoData,
  profitCentreData,
  salesTrendData,
  salesTrendQuarterly,
  salesTrendYtd,
  salesQuantityData,
  segmentData,
  type NamedValue,
} from "@/lib/management-data";

export function Card({
  title,
  meta,
  children,
  className = "",
}: {
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex min-w-0 flex-col rounded-xl border border-[#E5EAF1] bg-white p-4 shadow-[0_1px_2px_rgba(16,27,61,0.04)] ${className}`}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <h2 className="truncate text-[15px] font-semibold text-[#101B3D]">{title}</h2>
        {meta ? <div className="shrink-0">{meta}</div> : null}
      </div>
      <div className="mt-3 min-w-0 flex-1">{children}</div>
    </section>
  );
}

const axisStyle = { fontSize: 11, fill: "#68738A" } as const;
const tooltipStyle = {
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid #E5EAF1",
} as const;

const TREND_MODES = ["Monthly", "Quarterly", "YTD"] as const;
type TrendMode = (typeof TREND_MODES)[number];

export function SalesTrendChart() {
  const [mode, setMode] = useState<TrendMode>("Monthly");
  const data =
    mode === "Monthly" ? salesTrendData : mode === "Quarterly" ? salesTrendQuarterly : salesTrendYtd;

  return (
    <Card
      title="Sales Trend (Amount)"
      meta={
        <div className="flex items-center gap-1">
          {TREND_MODES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              className={[
                "rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors",
                mode === option
                  ? "border-[#1769E8] bg-[#1769E8] text-white"
                  : "border-[#E5EAF1] bg-white text-[#68738A] hover:bg-[#F7F9FC]",
              ].join(" ")}
            >
              {option}
            </button>
          ))}
        </div>
      }
    >
      <div className="h-[248px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#EEF2F8" vertical={false} />
            <XAxis dataKey="month" tick={axisStyle} tickLine={false} axisLine={{ stroke: "#E5EAF1" }} />
            <YAxis
              tick={axisStyle}
              tickLine={false}
              axisLine={false}
              width={52}
              label={{
                value: "Amount (₹ Cr)",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 11, fill: "#68738A" },
              }}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line
              type="monotone"
              dataKey="current"
              name="Current Period (Jan 2025 - Aug 2026)"
              stroke={CHART_COLORS.blue}
              strokeWidth={2.4}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="previous"
              name="Previous Period (Jan 2024 - Aug 2025)"
              stroke="#94A3B8"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function SegmentDonutChart() {
  return (
    <Card title="Sales by Segment (Amount)">
      <div className="flex items-center gap-3">
        <div className="relative h-[180px] w-[180px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={segmentData}
                dataKey="value"
                nameKey="name"
                innerRadius={54}
                outerRadius={84}
                paddingAngle={1}
                stroke="none"
              >
                {segmentData.map((slice) => (
                  <Cell key={slice.name} fill={slice.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [`₹ ${value.toFixed(2)} Cr`, "Amount"]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="text-[15px] font-bold text-[#101B3D]">₹ 417.42 Cr</p>
              <p className="text-[11px] text-[#68738A]">Total</p>
            </div>
          </div>
        </div>
        <ul className="min-w-0 flex-1 space-y-1.5">
          {segmentData.map((slice) => (
            <li key={slice.name} className="flex min-w-0 items-center gap-2 text-[12px]">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: slice.color }}
              />
              <span className="truncate text-[#101B3D]">{slice.name}</span>
              <span className="ml-auto shrink-0 font-semibold text-[#68738A]">{slice.pct}%</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export function HorizontalBarChart({
  title,
  data,
  color,
}: {
  title: string;
  data: NamedValue[];
  color: string;
}) {
  const max = Math.max(...data.map((row) => row.value));
  return (
    <Card
      title={title}
      meta={<span className="text-[11px] text-[#68738A]">Amount (₹ Cr)</span>}
    >
      <ul className="space-y-2">
        {data.map((row) => (
          <li key={row.name} className="grid grid-cols-[110px_minmax(0,1fr)_54px] items-center gap-2">
            <span className="truncate text-[11px] text-[#101B3D]" title={row.name}>
              {row.name}
            </span>
            <span className="h-3 w-full overflow-hidden rounded-sm bg-[#F1F5FA]">
              <span
                className="block h-full rounded-sm"
                style={{ width: `${(row.value / max) * 100}%`, backgroundColor: color }}
              />
            </span>
            <span className="text-right text-[11px] font-semibold text-[#101B3D]">
              {row.value.toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function ParetoChart() {
  return (
    <Card title="Customer Contribution (Pareto)">
      <div className="h-[248px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={paretoData} margin={{ top: 18, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#EEF2F8" vertical={false} />
            <XAxis dataKey="name" tick={axisStyle} tickLine={false} axisLine={{ stroke: "#E5EAF1" }} />
            <YAxis yAxisId="left" tick={axisStyle} tickLine={false} axisLine={false} width={44} />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tick={axisStyle}
              tickLine={false}
              axisLine={false}
              width={40}
              unit="%"
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar
              yAxisId="left"
              dataKey="amount"
              name="Sales Amount (₹ Cr)"
              fill={CHART_COLORS.blue}
              radius={[3, 3, 0, 0]}
              barSize={26}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulative"
              name="Cumulative %"
              stroke={CHART_COLORS.orange}
              strokeWidth={2.2}
              dot={{ r: 3, fill: CHART_COLORS.orange }}
            >
              <LabelList
                dataKey="cumulative"
                position="top"
                formatter={(value: number) => `${value}%`}
                style={{ fontSize: 10, fill: "#68738A" }}
              />
            </Line>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function MainGroupTreemap() {
  return (
    <Card title="Sales by Main Group (Amount)">
      <div className="grid h-[248px] grid-cols-2 grid-rows-3 gap-2">
        {mainGroupData.map((block) => (
          <button
            key={block.name}
            type="button"
            title={`${block.name} · ₹ ${block.amount.toFixed(2)} Cr · ${block.pct}%`}
            className="flex min-w-0 flex-col items-center justify-center rounded-lg px-2 text-center text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: block.color }}
          >
            <span className="w-full truncate text-[12px] font-semibold">{block.name}</span>
            <span className="text-[12px]">₹ {block.amount.toFixed(2)} Cr</span>
            <span className="text-[11px] opacity-90">{block.pct}%</span>
          </button>
        ))}
      </div>
    </Card>
  );
}

export function SalesQuantityChart() {
  return (
    <Card title="Sales vs Quantity Trend">
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={salesQuantityData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#EEF2F8" vertical={false} />
            <XAxis dataKey="month" tick={axisStyle} tickLine={false} axisLine={{ stroke: "#E5EAF1" }} />
            <YAxis yAxisId="left" tick={axisStyle} tickLine={false} axisLine={false} width={44} />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={axisStyle}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="amount"
              name="Amount (₹ Cr)"
              stroke={CHART_COLORS.blue}
              strokeWidth={2.4}
              dot={{ r: 3 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="quantity"
              name="Quantity (Lakhs)"
              stroke={CHART_COLORS.green}
              strokeWidth={2.4}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function TopProfitCentres() {
  return (
    <HorizontalBarChart
      title="Top 10 Profit Centres by Amount"
      data={profitCentreData}
      color={CHART_COLORS.blue}
    />
  );
}

export function TopCustomers() {
  return (
    <HorizontalBarChart
      title="Top 10 Customers by Amount"
      data={customerData}
      color={CHART_COLORS.teal}
    />
  );
}

