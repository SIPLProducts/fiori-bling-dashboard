import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
} from "recharts";
import {
  Filter,
  RotateCcw,
  Search,
  Download,
  IndianRupee,
  Users,
  Gauge,
  Building2,
  Boxes,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  BatteryCharging,
  CalendarDays,

} from "lucide-react";

import { Panel } from "@/components/report-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MultiSelect } from "@/components/multi-select";
import { downloadCsv } from "@/lib/chart-export";
import { formatDateTimeISTLabel } from "@/lib/format";
import {
  applySdFilters,
  buildSdAnalytics,
  emptySdFilters,
  fetchSdLines,
  uniqueValues,
  type NamedTotal,
  type SdFilters,
  type SdLine,
} from "@/lib/sd-live";
import { getSalesSyncStatus } from "@/lib/zfisales.functions";

const INR = (value: number) =>
  value.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const NUM = (value: number) => value.toLocaleString("en-IN", { maximumFractionDigits: 0 });

function compact(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1e7) return `${(value / 1e7).toFixed(2)}\u00A0Cr`;
  if (abs >= 1e5) return `${(value / 1e5).toFixed(2)}\u00A0L`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}\u00A0K`;
  return NUM(value);
}

/** Shorter form for axis ticks so labels never get clipped. */
function axisCompact(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1e7) return `${Math.round(value / 1e7).toLocaleString("en-IN")}\u00A0Cr`;
  if (abs >= 1e5) return `${Math.round(value / 1e5).toLocaleString("en-IN")}\u00A0L`;
  if (abs >= 1e3) return `${Math.round(value / 1e3).toLocaleString("en-IN")}\u00A0K`;
  return NUM(value);
}

/** Compact INR display: crores as "Cr", lakhs as "L", thousands as "K". */
const INRC = (value: number) => `₹${compact(value)}`;

/** Quantity display in Indian units: Crores / Lakhs / thousands. */
function QTY(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1e7) return `${(value / 1e7).toFixed(2)}\u00A0Cr`;
  if (abs >= 1e5) return `${(value / 1e5).toFixed(2)}\u00A0Lakhs`;
  return NUM(value);
}


/* ---- UI visibility flags: hidden elements keep their code intact; flip ----
 * ---- a flag back to true to show the element again. ---------------------- */
const SHOW_QUANTITY_TILE = false;
const SHOW_AVG_ORDER_VALUE_TILE = false;
const SHOW_TOP_PROFIT_CENTRE_TILE = false;
const SHOW_PLANT_FILTER = false;
/** Plant options removed from the Plant dropdown list. */
const PLANT_OPTIONS_EXCLUDED = ["1200"];
const SALES_TYPE_TABS = ["All", "Domestic", "Services", "Exports"] as const;

const KPI_TONES = [
  "var(--kpi-1)",
  "var(--kpi-2)",
  "var(--kpi-3)",
  "var(--kpi-4)",
  "var(--kpi-5)",
  "var(--kpi-6)",
];

const CHART_COLORS = KPI_TONES;

/** Stable colour per profit centre so the same centre reads the same everywhere. */
const PC_PALETTE = [
  "var(--kpi-1)",
  "var(--kpi-5)",
  "var(--kpi-3)",
  "var(--kpi-4)",
  "var(--kpi-2)",
  "var(--kpi-6)",
];

function buildPcColors(rows: { profitCtr: string; amount: number }[]) {
  const totals = new Map<string, number>();
  for (const r of rows) {
    const key = r.profitCtr || "—";
    totals.set(key, (totals.get(key) ?? 0) + r.amount);
  }
  const ordered = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const map = new Map<string, string>();
  ordered.forEach(([key], i) => map.set(key, PC_PALETTE[i % PC_PALETTE.length] ?? PC_PALETTE[0]!));
  return { map, ordered };
}

/** Thin out dense value labels so they stay readable. */
function labelEvery(count: number, index?: number) {
  if (index == null) return true;
  const step = count > 24 ? 3 : count > 14 ? 2 : 1;
  return index % step === 0;
}

/* -------- Sales trend helpers: current vs previous period aggregation ------ */

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const TREND_MODES = ["Monthly", "Quarterly", "YTD"] as const;
type TrendMode = (typeof TREND_MODES)[number];
type MonthRow = { month: string; revenue: number; quantity: number; documents: number };

const shortMonth = (i: number) => {
  const m = MONTHS[i] ?? "";
  return m.charAt(0) + m.slice(1, 3).toLowerCase();
};

function parseMonth(label: string) {
  const [m, y] = (label || "").split("-");
  const idx = MONTHS.indexOf((m ?? "").toUpperCase().slice(0, 3));
  const year = Number(y);
  return idx >= 0 && Number.isFinite(year) ? { idx, year } : null;
}

function buildTrend(monthly: MonthRow[], mode: TrendMode) {
  const parsed = monthly
    .map((r) => ({ ...r, p: parseMonth(r.month) }))
    .filter((r): r is MonthRow & { p: { idx: number; year: number } } => r.p != null);
  if (!parsed.length) return { rows: [] as { label: string; current: number; previous: number | null }[], cy: "", py: "" };

  const cy = Math.max(...parsed.map((r) => r.p.year));
  const py = cy - 1;
  const hasPrev = parsed.some((r) => r.p.year === py);
  const value = (year: number, idx: number) =>
    parsed.filter((r) => r.p.year === year && r.p.idx === idx).reduce((s, r) => s + r.revenue, 0);

  if (mode === "Quarterly") {
    const rows = [0, 1, 2, 3].map((q) => {
      const idxs = [q * 3, q * 3 + 1, q * 3 + 2];
      return {
        label: `Q${q + 1}`,
        current: idxs.reduce((s, i) => s + value(cy, i), 0),
        previous: hasPrev ? idxs.reduce((s, i) => s + value(py, i), 0) : null,
      };
    });
    return { rows, cy: String(cy), py: hasPrev ? String(py) : "" };
  }

  let cc = 0;
  let pc = 0;
  const rows: { label: string; current: number; previous: number | null }[] = [];
  for (let i = 0; i < 12; i++) {
    const c = value(cy, i);
    const p = value(py, i);
    cc += c;
    pc += p;
    if (mode === "Monthly" && !c && !p) continue;
    rows.push({
      label: shortMonth(i),
      current: mode === "YTD" ? cc : c,
      previous: hasPrev ? (mode === "YTD" ? pc : p) : null,
    });
  }
  return { rows, cy: String(cy), py: hasPrev ? String(py) : "" };
}

/** Amount + quantity per month for the most recent year. */
function latestYearMonths(monthly: MonthRow[]) {
  const parsed = monthly
    .map((r) => ({ ...r, p: parseMonth(r.month) }))
    .filter((r): r is MonthRow & { p: { idx: number; year: number } } => r.p != null);
  if (!parsed.length)
    return monthly.map((r) => ({ label: r.month, revenue: r.revenue, quantity: r.quantity }));
  const cy = Math.max(...parsed.map((r) => r.p.year));
  return parsed
    .filter((r) => r.p.year === cy)
    .sort((a, b) => a.p.idx - b.p.idx)
    .map((r) => ({ label: shortMonth(r.p.idx), revenue: r.revenue, quantity: r.quantity }));
}

/** Human label for the active posting-date range shown next to the title. */
function periodLabel(monthly: MonthRow[], from: string, to: string) {
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? ""
      : `${shortMonth(d.getMonth())} ${d.getFullYear()}`;
  };
  if (from || to) return `${fmt(from) || "…"} - ${fmt(to) || "…"}`;
  const first = monthly[0]?.month;
  const last = monthly[monthly.length - 1]?.month;
  const pretty = (label?: string) => {
    const p = label ? parseMonth(label) : null;
    return p ? `${shortMonth(p.idx)} ${p.year}` : "";
  };
  return first && last ? `${pretty(first)} - ${pretty(last)}` : "All postings";
}


function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/* ------------------------------ small pieces ------------------------------ */

function KpiCard({
  label,
  value,
  caption,
  delta,
  tone = 0,
  icon: Icon,
  children,
  onClick,
  active = false,
}: {
  label: string;
  value: string;
  caption?: string;
  delta?: { pct: number | null; label: string };
  tone?: number;
  icon: React.ComponentType<{ className?: string }>;
  children?: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {

  const color = KPI_TONES[tone % KPI_TONES.length];
  return (
    <section
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-tile transition-shadow hover:shadow-lg ${
        onClick ? "cursor-pointer focus:outline-none" : ""
      }`}
      style={
        active
          ? { boxShadow: `0 0 0 2px color-mix(in oklab, ${color} 45%, transparent)` }
          : undefined
      }
    >
      <div className="flex items-center gap-3">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-full"
          style={{ background: `color-mix(in oklab, ${color} 14%, var(--color-card))`, color }}
        >
          <Icon className="size-5" />
        </span>
        <p className="truncate text-sm font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="tabular mt-3 text-2xl font-semibold text-card-foreground">{value}</p>
      {delta && delta.pct != null ? (
        <p className="mt-1.5 flex items-center gap-1 text-xs">
          <span
            className="tabular font-semibold"
            style={{ color: delta.pct >= 0 ? "var(--kpi-up, #16a34a)" : "var(--kpi-down, #dc2626)" }}
          >
            {delta.pct >= 0 ? "↑" : "↓"} {Math.abs(delta.pct).toFixed(1)}%
          </span>
          <span className="truncate text-muted-foreground">{delta.label}</span>
        </p>
      ) : null}
      {caption ? <p className="mt-1 truncate text-xs text-muted-foreground">{caption}</p> : null}
      {children}

    </section>
  );
}



function ShareBars({ items, total }: { items: { name: string; value: number }[]; total: number }) {
  if (!total) return null;
  return (
    <div className="mt-3 space-y-1.5">
      {items.slice(0, 3).map((item, i) => (
        <div key={item.name}>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="truncate">{item.name || "—"}</span>
            <span className="tabular">{((item.value / total) * 100).toFixed(1)}%</span>
          </div>
          <div className="mt-0.5 h-1.5 rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full"
              style={{
                width: `${Math.max(2, Math.min(100, (item.value / total) * 100))}%`,
                background: KPI_TONES[i % KPI_TONES.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const tooltipStyle = {
  contentStyle: {
    background: "var(--color-card)",
    border: "1px solid var(--color-border)",
    borderRadius: 6,
    fontSize: 12,
  },
} as const;

function HBar({
  data,
  valueLabel,
  tone = 0,
  height,
}: {
  data: { name: string; value: number }[];
  valueLabel: string;
  tone?: number;
  height?: number | string;
}) {
  if (!data.length) return <p className="py-10 text-center text-sm text-muted-foreground">No data</p>;
  const color = KPI_TONES[tone % KPI_TONES.length];
  return (
    <ResponsiveContainer width="100%" height={height ?? Math.max(220, data.length * 34)}>

      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 76 }}>
        <CartesianGrid strokeDasharray="2 6" stroke="var(--color-border)" horizontal={false} />
        <XAxis type="number" tickFormatter={compact} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
        <YAxis
          type="category"
          dataKey="name"
          width={230}
          interval={0}
          tickMargin={4}
          tickFormatter={(v: string) => (v && v.length > 44 ? `${v.slice(0, 42)}…` : v || "—")}
          tick={{ fontSize: 10 }}
          stroke="var(--color-muted-foreground)"
        />
        <Tooltip {...tooltipStyle} formatter={(v: number) => [INRC(v), valueLabel]} />
        <Bar dataKey="value" radius={[3, 3, 3, 3]} fill={color}>
          <LabelList
            dataKey="value"
            position="right"
            formatter={(v: number) => compact(v)}
            fontSize={10}
            fill="var(--color-foreground)"
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function RankedList({ items, total }: { items: { name: string; value: number; count: number }[]; total: number }) {
  if (!items.length) return <p className="py-10 text-center text-sm text-muted-foreground">No data</p>;
  return (
    <ol className="space-y-2.5">
      {items.map((item, i) => {
        const color = KPI_TONES[i % KPI_TONES.length];
        const share = total ? (item.value / total) * 100 : 0;
        return (
          <li key={item.name} className="rounded-md border border-border/70 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold"
                  style={{ background: `color-mix(in oklab, ${color} 22%, transparent)`, color }}
                >
                  {i + 1}
                </span>
                <span className="truncate text-sm" title={item.name}>
                  {item.name || "—"}
                </span>
              </span>
              <Badge variant="secondary" className="tabular shrink-0">
                {INRC(item.value)}
              </Badge>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-muted">
              <div
                className="h-1.5 rounded-full"
                style={{ width: `${Math.max(2, Math.min(100, share))}%`, background: color }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
              <span>{item.count} records</span>
              <span className="tabular">{share.toFixed(1)}%</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function BarList({
  items,
  tone = 0,
  full = false,
}: {
  items: { name: string; value: number; count?: number }[];
  tone?: number;
  full?: boolean;
}) {
  if (!items.length) return <p className="py-10 text-center text-sm text-muted-foreground">No data</p>;
  const max = Math.max(...items.map((i) => i.value), 1);
  const tip = (item: { name: string; value: number; count?: number }) =>
    `${item.name || "—"}\n₹${item.value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}${
      item.count != null ? `\n${item.count.toLocaleString("en-IN")} records` : ""
    }`;
  return (
    <div className={full ? "flex h-full flex-col gap-1.5" : "space-y-1.5"}>
      <div className="flex items-center justify-end gap-3 text-[11px] font-medium text-muted-foreground">
        <span>Amount</span>
        {full ? <span className="w-20 shrink-0 text-right">Records</span> : null}
      </div>
      {items.map((item) => (
        <div key={item.name} className={`flex items-center gap-3 ${full ? "min-h-0 flex-1" : ""}`} title={tip(item)}>
          <span
            className="w-[34%] shrink-0 truncate whitespace-nowrap text-[11px] text-muted-foreground"
            title={tip(item)}
          >
            {item.name || "—"}
          </span>
          <div className="min-w-0 flex-1">
            <div
              className="rounded-sm"
              style={{
                width: `${Math.max(2, (item.value / max) * 100)}%`,
                height: full ? "55%" : 12,
                minHeight: 10,
                background: KPI_TONES[tone % KPI_TONES.length],
              }}
            />
          </div>
          <span
            className="tabular w-20 shrink-0 whitespace-nowrap text-right text-[11px] font-medium"
            title={tip(item)}
          >
            ₹{compact(item.value)}
          </span>
          {full ? (
            <span
              className="tabular w-20 shrink-0 whitespace-nowrap text-right text-[11px] text-muted-foreground"
              title={tip(item)}
            >
              {item.count != null ? item.count.toLocaleString("en-IN") : "—"}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function MixBars({
  items,
  total,
  height,
}: {
  items: { name: string; value: number }[];
  total: number;
  height?: number | string;
}) {
  if (!items.length) return <p className="py-10 text-center text-sm text-muted-foreground">No data</p>;
  return (
    <ResponsiveContainer width="100%" height={height ?? Math.max(220, items.length * 46)}>

      <BarChart data={items} layout="vertical" margin={{ left: 0, right: 140, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="2 6" stroke="var(--color-border)" horizontal={false} />
        <XAxis type="number" tickFormatter={compact} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fontSize: 11 }}
          stroke="var(--color-muted-foreground)"
        />
        <Tooltip
          {...tooltipStyle}
          formatter={(v: number, _n: string, p: { payload?: { name?: string } }) => [
            `${INRC(v)} · ${total ? ((v / total) * 100).toFixed(1) : "0"}%`,
            p?.payload?.name ?? "Revenue",
          ]}
        />
        <Bar dataKey="value" radius={[3, 3, 3, 3]}>
          {items.map((item, i) => (
            <Cell key={item.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            formatter={(v: number) =>
              `${compact(v)} (${total ? ((v / total) * 100).toFixed(1) : "0"}%)`
            }
            fontSize={11}
            fontWeight={600}
            fill="var(--color-foreground)"
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

const SEGMENT_PAGE = 6;

/** X/Y bar chart of main groups; clicking a bar drills into that group's sub groups. */
function MainGroupBars({
  items,
  subGroups,
  full = false,
  selected,
  onSelect,
}: {
  items: NamedTotal[];
  subGroups: Record<string, NamedTotal[]>;
  full?: boolean;
  selected: string | null;
  onSelect: (name: string | null) => void;
}) {
  const data = selected ? (subGroups[selected] ?? []) : items;
  const drill = (name: string) => {
    if (!selected && name) onSelect(name);
  };
  const renderNameTick = (props: {
    x?: number;
    y?: number;
    payload?: { value?: string };
  }) => {
    const { x = 0, y = 0, payload } = props;
    const raw = payload?.value ?? "";
    const label = raw && raw.length > 14 ? `${raw.slice(0, 13)}…` : raw || "—";
    return (
      <text
        x={x}
        y={y}
        transform={`rotate(-28, ${x}, ${y})`}
        textAnchor="end"
        fontSize={10}
        fill="var(--color-muted-foreground)"
        style={{ cursor: selected ? "default" : "pointer" }}
        onClick={() => drill(raw)}
      >
        <title>{raw}</title>
        {label}
      </text>
    );
  };
  const renderBarLabel = (props: {
    x?: string | number | undefined;
    y?: string | number | undefined;
    width?: string | number | undefined;
    value?: number | string | undefined;
    index?: number | undefined;
  }) => {
    const x = Number(props.x ?? 0);
    const y = Number(props.y ?? 0);
    const width = Number(props.width ?? 0);
    const { value, index = 0 } = props;
    const item = data[index];
    return (
      <text
        x={x + width / 2}
        y={y - 4}
        textAnchor="middle"
        fontSize={10}
        fill="var(--color-foreground)"
        style={{ cursor: selected ? "default" : "pointer" }}
        onClick={() => item && drill(item.name)}
      >
        {compact(Number(value ?? 0))}
      </text>
    );
  };
  if (!items.length) return <p className="py-10 text-center text-sm text-muted-foreground">No data</p>;
  return (
    <div className={full ? "flex h-full flex-col" : ""}>
      <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="min-w-0 truncate">
          {selected ? (
            <>
              <button type="button" className="hover:text-foreground" onClick={() => onSelect(null)}>
                ← All main groups
              </button>
              {" · "}
              <span className="text-foreground">{selected}</span>
            </>
          ) : (
            "Click a bar to see its sub groups"
          )}
        </span>
        <span className="tabular shrink-0">₹{compact(data.reduce((s, d) => s + d.value, 0))}</span>
      </div>
      <div className={full ? "min-h-0 flex-1" : ""}>
        <ResponsiveContainer width="100%" height={full ? "100%" : 260}>
          <BarChart data={data} margin={{ left: 0, right: 8, top: 16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 6" stroke="var(--color-border)" vertical={false} />
            <XAxis
              type="category"
              dataKey="name"
              interval={0}
              tickMargin={8}
              height={64}
              tick={renderNameTick}
              stroke="var(--color-muted-foreground)"
            />
            <YAxis
              type="number"
              width={56}
              tickFormatter={axisCompact}
              tick={{ fontSize: 11 }}
              stroke="var(--color-muted-foreground)"
            />
            <Tooltip
              {...tooltipStyle}
              formatter={(v: number, _name: unknown, item: { payload?: NamedTotal }) => [
                `${INRC(v)} · ${item?.payload?.count ?? 0} records`,
                selected ? "Sub group" : "Main group",
              ]}
            />
            <Bar
              dataKey="value"
              radius={[3, 3, 3, 3]}
              fill={KPI_TONES[3]}
              minPointSize={4}
              cursor={selected ? "default" : "pointer"}
              onClick={(entry: { name?: unknown }) => {
                if (!selected && entry?.name) onSelect(String(entry.name));
              }}
            >
              <LabelList dataKey="value" position="top" content={renderBarLabel} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SegmentDonut({ items, total }: { items: { name: string; value: number }[]; total: number }) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / SEGMENT_PAGE));
  const current = Math.min(page, pages - 1);
  const start = current * SEGMENT_PAGE;
  const visible = items.slice(start, start + SEGMENT_PAGE);

  if (!items.length || !total)
    return <p className="py-10 text-center text-sm text-muted-foreground">No data</p>;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-[230px] w-full max-w-[240px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={items}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={1}
              stroke="none"
            >
              {items.map((item, i) => (
                <Cell key={item.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              {...tooltipStyle}
              formatter={(v: number, n: string) => [
                `${INRC(v)} · ${((v / total) * 100).toFixed(1)}%`,
                n || "—",
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-base font-semibold">₹{compact(total)}</p>
            <p className="text-[11px] text-muted-foreground">Total amount</p>
          </div>
        </div>
      </div>
      <div className="w-full min-w-0 flex-1 space-y-2">
        {visible.map((item, i) => {
          const idx = start + i;
          return (
            <div key={item.name} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-sm"
                  style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }}
                />
                <span className="truncate" title={item.name || "—"}>
                  {item.name || "—"}
                </span>
              </span>
              <span className="tabular shrink-0 whitespace-nowrap text-muted-foreground">
                ₹{compact(item.value)} · {((item.value / total) * 100).toFixed(1)}%
              </span>
            </div>
          );
        })}
        {items.length > SEGMENT_PAGE && (
          <div className="flex items-center justify-end gap-2 pt-1 text-[11px] text-muted-foreground">
            <span>
              {start + 1}–{Math.min(start + SEGMENT_PAGE, items.length)} of {items.length}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-6"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
              aria-label="Previous segments"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-6"
              disabled={current >= pages - 1}
              onClick={() => setPage(current + 1)}
              aria-label="Next segments"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}



const TREEMAP_SHOW_MAIN = 5;
const TREEMAP_SHOW_SUB = 8;
const OTHERS = "Others";

type TreemapItem = { name: string; value: number };

/** Split a sorted list into individually-shown tiles plus an aggregate "Others" tile. */
function tileSlice(sorted: TreemapItem[], show: number): TreemapItem[] {
  const head = sorted.slice(0, show);
  const rest = sorted.slice(show);
  const others = rest.reduce((s, i) => s + i.value, 0);
  return others > 0 ? [...head, { name: OTHERS, value: others }] : head;
}

function MainGroupTreemap({
  items,
  subGroups,
  full = false,
  selected,
  onSelect,
}: {
  items: TreemapItem[];
  subGroups: Record<string, TreemapItem[]>;
  full?: boolean;
  selected: string | null;
  onSelect: (name: string | null) => void;
}) {
  // Drill path: "Others" drills are kept locally (Others has no sub groups to
  // sync); a named main group is shared with the bar chart via `selected`.
  const [othersTrail, setOthersTrail] = useState(0);
  const path = useMemo(() => {
    const base = Array.from({ length: othersTrail }, () => OTHERS);
    return selected ? [...base, selected] : base;
  }, [othersTrail, selected]);
  const setPath = (next: string[]) => {
    const lastNamed = [...next].reverse().find((s) => s !== OTHERS) ?? null;
    onSelect(lastNamed);
    setOthersTrail(next.filter((s) => s === OTHERS).length);
  };

  const sortedMain = useMemo(() => [...items].sort((a, b) => b.value - a.value), [items]);

  const active = useMemo(() => {
    let list = sortedMain;
    let show = TREEMAP_SHOW_MAIN;
    for (const step of path) {
      if (step === OTHERS) {
        list = list.slice(show);
      } else {
        list = [...(subGroups[step] ?? [])].sort((a, b) => b.value - a.value);
        show = TREEMAP_SHOW_SUB;
      }
    }
    return tileSlice(list, show);
  }, [sortedMain, path, subGroups]);

  const total = active.reduce((s, i) => s + i.value, 0);
  // Once a named main group is in the path we are at sub-group level (no further drill).
  const atSubLevel = path.some((p) => p !== OTHERS);

  if (!items.length) return <p className="py-10 text-center text-sm text-muted-foreground">No data</p>;

  // Even grid: every tile is the same size regardless of its value.
  const n = active.length;
  const cols = full
    ? n <= 2
      ? n
      : n <= 6
        ? 3
        : 4
    : n <= 2
      ? n
      : n <= 4
        ? 2
        : 3;
  // Uniform label sizes: slightly smaller when tiles are narrow.
  const nameSize = full ? 13 : 12;
  const lineSize = full ? 12 : 11;

  return (
    <div className={full ? "flex h-full flex-col" : ""}>
      <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="min-w-0 truncate">
          {path.length ? (
            <>
              <button type="button" className="hover:text-foreground" onClick={() => setPath([])}>
                ← All main groups
              </button>
              {path.map((step, i) => (
                <span key={i}>
                  {" · "}
                  <button
                    type="button"
                    className="text-foreground hover:underline"
                    onClick={() => setPath(path.slice(0, i + 1))}
                  >
                    {step}
                  </button>
                </span>
              ))}
            </>
          ) : (
            "Click a group to see its sub groups"
          )}
        </span>
        <span className="tabular shrink-0">₹{compact(total)}</span>
      </div>
      <div
        className="grid w-full gap-2"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          ...(full ? { flex: 1, minHeight: 0, gridAutoRows: "1fr" } : { height: 300, gridAutoRows: "1fr" }),
        }}
      >
        {active.map((r, i) => {
          const color = CHART_COLORS[i % CHART_COLORS.length]!;
          const share = total ? (r.value / total) * 100 : 0;
          const canDrill = r.name === OTHERS || !atSubLevel;
          return (
            <button
              key={`${path.join("/")}:${r.name}`}
              type="button"
              title={`${r.name} · ₹${compact(r.value)} · ${share.toFixed(1)}%`}
              onClick={() => {
                if (!canDrill) return;
                setPath([...path, r.name]);
              }}
              className={`flex min-h-0 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-md p-2 text-center transition-opacity ${canDrill ? "hover:opacity-90" : "cursor-default"}`}
              style={{
                background: color,
                color: "var(--color-primary-foreground)",
              }}
            >
              <span
                className="line-clamp-2 w-full break-words leading-tight font-medium"
                style={{ fontSize: nameSize }}
              >
                {r.name}
              </span>
              <span className="tabular block leading-tight" style={{ fontSize: lineSize }}>
                ₹{compact(r.value)}
              </span>
              <span className="tabular block leading-tight opacity-90" style={{ fontSize: lineSize }}>
                {share.toFixed(1)}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}


/* --------------------------------- table ---------------------------------- */

type Column = { key: string; label: string; numeric?: boolean; render: (r: SdLine) => string };

const COLUMNS: Column[] = [
  { key: "gl", label: "GL account", render: (r) => r.gl || "—" },
  { key: "glName", label: "GL name", render: (r) => r.glName || "—" },
  { key: "docNo", label: "Document No", render: (r) => r.docNo || "—" },
  { key: "docItem", label: "Item", render: (r) => r.docItem || "—" },
  { key: "postingDate", label: "Posting date", render: (r) => r.postingDate || "—" },
  { key: "month", label: "Month", render: (r) => r.month || "—" },
  {
    key: "profitCtr",
    label: "Profit centre",
    render: (r) => [r.profitCtr, r.pcShortName || r.profitCtrName].filter(Boolean).join(" · ") || "—",
  },

  { key: "customer", label: "Customer", render: (r) => r.customerName || r.customer || "—" },
  { key: "salesType", label: "Sales type", render: (r) => r.salesType || "—" },
  {
    key: "group",
    label: "Main / Sub group",
    render: (r) => [r.mainGroup, r.subGroup].filter(Boolean).join(" / ") || "—",
  },
  { key: "material", label: "Material", render: (r) => r.material || "—" },
  { key: "materialDesc", label: "Material description", render: (r) => r.materialDesc || "—" },
  {
    key: "modelRange",
    label: "Model / Range / Type",
    render: (r) => [r.model, r.productRange, r.productType].filter(Boolean).join(" / ") || "—",
  },
  { key: "unit", label: "UOM", render: (r) => r.unit || "—" },
  { key: "quantity", label: "Qty", numeric: true, render: (r) => NUM(r.quantity) },
  { key: "totalAh", label: "Total AH", numeric: true, render: (r) => NUM(r.totalAh) },
  { key: "amount", label: "Amount in local cur.", numeric: true, render: (r) => INRC(r.amount) },
  { key: "segment", label: "Segment", render: (r) => r.businessSegment || r.segment || "—" },
  { key: "salesRepName", label: "Sales employee", render: (r) => r.salesRepName || "—" },
  { key: "incoterms", label: "Incoterms", render: (r) => r.incoterms || "—" },
  { key: "usageDesc", label: "Usage", render: (r) => r.usageDesc || "—" },
];

const PAGE_SIZE = 50;

/* --------------------------- focused KPI drill table ---------------------- */

export type FocusRow = { a: string; b: string; amount: number; color?: string | undefined };

function FocusTable({
  title,
  headers,
  rows,
  onBack,
  onExport,
}: {
  title: string;
  headers: [string, string, string];
  rows: FocusRow[];
  onBack: () => void;
  onExport: () => void;
}) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const slice = rows.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);
  const total = useMemo(() => rows.reduce((sum, r) => sum + r.amount, 0), [rows]);

  return (
    <Panel
      title={`${title} (${NUM(rows.length)})`}
      accent={1}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="mr-1 size-3.5" /> CSV
          </Button>
          <Button size="sm" onClick={onBack}>
            <ChevronLeft className="mr-1 size-3.5" /> Back to dashboard
          </Button>
        </div>
      }
    >
      <div className="max-h-[620px] overflow-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-muted">
            <tr className="text-left text-[11px] tracking-wide text-muted-foreground uppercase">
              <th className="px-3 py-2.5 font-semibold">{headers[0]}</th>
              <th className="px-3 py-2.5 font-semibold">{headers[1]}</th>
              <th className="px-3 py-2.5 text-right font-semibold whitespace-nowrap">{headers[2]}</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((r, i) => (
              <tr
                key={`${r.a}-${r.b}-${i}`}
                className={`border-t border-border/60 transition-colors hover:bg-accent/40 ${
                  i % 2 ? "bg-muted/30" : ""
                }`}
              >
                <td className="max-w-[320px] px-3 py-2" style={r.color ? { borderLeft: `3px solid ${r.color}` } : undefined}>
                  <span className="flex items-center gap-2">
                    {r.color ? (
                      <span className="size-2.5 shrink-0 rounded-sm" style={{ background: r.color }} />
                    ) : null}
                    <span className="truncate font-medium" title={r.a}>
                      {r.a}
                    </span>
                  </span>
                </td>
                <td className="max-w-[420px] px-3 py-2">
                  <span className="block truncate" title={r.b}>
                    {r.b}
                  </span>
                </td>
                <td
                  className={`tabular px-3 py-2 text-right whitespace-nowrap ${
                    r.amount < 0 ? "text-destructive" : ""
                  }`}
                  title={INR(r.amount)}
                >
                  {INRC(r.amount)}
                </td>
              </tr>
            ))}
            {!slice.length ? (
              <tr>
                <td colSpan={3} className="px-3 py-10 text-center text-muted-foreground">
                  No records match the current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
          {rows.length ? (
            <tfoot className="sticky bottom-0 bg-muted">
              <tr className="border-t border-border text-sm font-semibold">
                <td className="px-3 py-2.5" colSpan={2}>
                  Total
                </td>
                <td className="tabular px-3 py-2.5 text-right whitespace-nowrap" title={INR(total)}>
                  {INRC(total)}
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing {slice.length ? current * PAGE_SIZE + 1 : 0}–{current * PAGE_SIZE + slice.length} of{" "}
          {NUM(rows.length)}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <span>
            Page {current + 1} / {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </Panel>
  );
}


function LinesTable({
  rows,
  onExport,
  pcColors,
  pcLegend,
}: {
  rows: SdLine[];
  onExport: () => void;
  pcColors: Map<string, string>;
  pcLegend: { key: string; label: string; value: number; color: string }[];
}) {
  const [hidden, setHidden] = useState<string[]>([]);
  const [page, setPage] = useState(0);

  const visible = COLUMNS.filter((c) => !hidden.includes(c.key));
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const slice = rows.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  return (
    <Panel
      title={`Net Sales List (${NUM(rows.length)})`}
      accent={1}
      actions={
        <div className="flex items-center gap-2">
          <MultiSelect
            options={COLUMNS.map((c) => ({ value: c.key, label: c.label }))}
            selected={visible.map((c) => c.key)}
            onChange={(next) =>
              setHidden(COLUMNS.filter((c) => !next.includes(c.key)).map((c) => c.key))
            }
            placeholder="Columns"
          />
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="mr-1 size-3.5" /> CSV
          </Button>
        </div>
      }
    >
      {pcLegend.length ? (
        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 rounded-md border border-border/70 bg-muted/40 p-2.5 text-[11px]">
          <span className="font-medium text-muted-foreground">Profit centre colours:</span>
          {pcLegend.map((p) => (
            <span key={p.key} className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ background: p.color }} />
              <span className="truncate">{p.label}</span>
              <span className="tabular text-muted-foreground">{compact(p.value)}</span>
            </span>
          ))}
        </div>
      ) : null}
      <div className="max-h-[560px] overflow-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-muted">
            <tr className="text-left text-[11px] tracking-wide text-muted-foreground uppercase">
              {visible.map((c) => (
                <th
                  key={c.key}
                  className={`px-2.5 py-2 font-semibold whitespace-nowrap ${c.numeric ? "text-right" : ""}`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((r, i) => {
              const pcColor = pcColors.get(r.profitCtr || "—") ?? "var(--color-border)";
              return (
                <tr
                  key={`${r.docNo}-${r.docItem}-${r.material}-${i}`}
                  className="border-t border-border/60 hover:brightness-95"
                  style={{
                    background: `color-mix(in oklab, ${pcColor} ${i % 2 ? 14 : 8}%, var(--color-card))`,
                  }}
                >
                  {visible.map((c) => (
                    <td
                      key={c.key}
                      className={`px-2.5 py-1.5 whitespace-nowrap ${
                        c.numeric ? "tabular text-right" : ""
                      } ${c.key === "amount" && r.amount < 0 ? "text-destructive" : ""}`}
                      style={
                        c.key === "profitCtr"
                          ? { borderLeft: `3px solid ${pcColor}`, fontWeight: 500 }
                          : undefined
                      }
                    >
                      {c.key === "profitCtr" ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="size-2.5 shrink-0 rounded-sm" style={{ background: pcColor }} />
                          {c.render(r)}
                        </span>
                      ) : (
                        c.render(r)
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
            {!slice.length ? (
              <tr>
                <td colSpan={visible.length} className="px-2.5 py-8 text-center text-muted-foreground">
                  No lines match the current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing {slice.length ? current * PAGE_SIZE + 1 : 0}–{current * PAGE_SIZE + slice.length} of{" "}
          {NUM(rows.length)}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}>
            <ChevronLeft className="size-3.5" />
          </Button>
          <span className="tabular">
            {current + 1} / {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </Panel>
  );
}

/* -------------------------------- dashboard ------------------------------- */

export function SdLiveDashboard() {
  const [filters, setFilters] = useState<SdFilters>(emptySdFilters);
  const [showFilters, setShowFilters] = useState(false);
  // Shared drill-down: selecting a main group in either the treemap or the
  // bar chart updates both cards.

  const [selectedMainGroup, setSelectedMainGroup] = useState<string | null>(null);
  const [salesTypeTab, setSalesTypeTab] = useState<(typeof SALES_TYPE_TABS)[number]>("All");
  const [focus, setFocus] = useState<"revenue" | "customers" | null>(null);
  const [trendMode, setTrendMode] = useState<TrendMode>("Monthly");



  const { data: lines, isLoading } = useQuery({
    queryKey: ["sd-live-lines"],
    queryFn: fetchSdLines,
  });

  const { data: sync } = useQuery({ queryKey: ["sd-sync-status"], queryFn: getSalesSyncStatus });

  const all = useMemo(() => lines ?? [], [lines]);
  const typeFiltered = useMemo(() => {
    if (salesTypeTab === "All") return all;
    const target = salesTypeTab === "Services" ? "service" : salesTypeTab.toLowerCase();
    return all.filter((r) => (r.salesType || "").trim().toLowerCase() === target);
  }, [all, salesTypeTab]);
  const filtered = useMemo(() => applySdFilters(typeFiltered, filters), [typeFiltered, filters]);
  const analytics = useMemo(() => buildSdAnalytics(filtered), [filtered]);

  const opts = useMemo(
    () => ({
      plants: uniqueValues(all, (r) => r.plant).filter((p) => !PLANT_OPTIONS_EXCLUDED.includes(p)),
      profitCentres: uniqueValues(all, (r) => r.profitCtr),
    }),
    [all],
  );

  const set = (patch: Partial<SdFilters>) => setFilters((prev) => ({ ...prev, ...patch }));
  const toOptions = (values: string[]) => values.map((v) => ({ value: v, label: v }));

  const activeChips: { label: string; clear: () => void }[] = [];
  if (filters.from || filters.to)
    activeChips.push({
      label: `Posting ${filters.from || "…"} → ${filters.to || "…"}`,
      clear: () => set({ from: "", to: "" }),
    });
  const listChips: [keyof SdFilters, string][] = [
    ["plants", "Plant"],
    ["profitCentres", "Profit centre"],
  ];
  for (const [key, label] of listChips) {
    const value = filters[key] as string[];
    if (value.length)
      activeChips.push({
        label: `${label}: ${value.length === 1 ? value[0] : `${value.length} selected`}`,
        clear: () => set({ [key]: [] } as Partial<SdFilters>),
      });
  }

  const exportRows = () =>
    downloadCsv(
      filtered.map((r) => {
        const out: Record<string, string | number> = {};
        for (const c of COLUMNS)
          out[c.label] =
            c.key === "amount"
              ? Math.round(r.amount)
              : c.numeric
                ? Number(c.render(r).replace(/[^\d.-]/g, ""))
                : c.render(r);
        return out;
      }),
      "sd-sales-lines.csv",
    );

  // grouped rows behind the clickable KPI tiles
  const focusRows: FocusRow[] = useMemo(() => {
    if (!focus) return [];
    const pcMap = buildPcColors(filtered).map;
    const map = new Map<string, FocusRow>();
    for (const r of filtered) {
      const pcKey = r.profitCtr || "—";
      const a =
        focus === "revenue"
          ? [pcKey, r.pcShortName || r.profitCtrName].filter(Boolean).join(" · ")
          : r.customerName || r.customer || "—";
      const b = focus === "revenue" ? r.customerName || r.customer || "—" : r.docNo || "—";
      const key = `${a}||${b}`;
      const cur = map.get(key) ?? {
        a,
        b,
        amount: 0,
        color: focus === "revenue" ? (pcMap.get(pcKey) ?? "var(--color-border)") : undefined,
      };
      cur.amount += r.amount;
      map.set(key, cur);
    }
    return [...map.values()].sort((x, y) => y.amount - x.amount);
  }, [focus, filtered]);


  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  const totalRevenue = analytics.kpis.revenue;

  const topUnit = filtered.find((r) => r.unit)?.unit ?? "";
  const pcColors = buildPcColors(filtered);
  const pcLabel = (key: string) => {
    const row = filtered.find((r) => (r.profitCtr || "—") === key);
    return [key, row?.pcShortName || row?.profitCtrName].filter(Boolean).join(" · ");
  };
  const pcLegend = pcColors.ordered.slice(0, 12).map(([key, value]) => ({
    key,
    label: pcLabel(key),
    value,
    color: pcColors.map.get(key) ?? "var(--color-border)",
  }));

  const focusHeaders: [string, string, string] =
    focus === "revenue"
      ? ["Profit centre", "Customer name", "Amount in local cur."]
      : ["Customer name", "Document No", "Amount in local cur."];

  const exportFocus = () =>
    downloadCsv(
      focusRows.map((r) => ({
        [focusHeaders[0]]: r.a,
        [focusHeaders[1]]: r.b,
        [focusHeaders[2]]: Math.round(r.amount),
      })),
      focus === "revenue" ? "net-sales-by-profit-centre.csv" : "net-sales-by-customer-document.csv",
    );



  const trend = buildTrend(analytics.monthly, trendMode);
  const salesVsQty = latestYearMonths(analytics.monthly);

  return (
    <div className="space-y-4">
      {/* executive header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Management Sales Dashboard</h2>
          <p className="text-sm text-muted-foreground">Executive Overview</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-card-foreground shadow-tile">
            <CalendarDays className="size-4 text-muted-foreground" />
            {periodLabel(analytics.monthly, filters.from, filters.to)}
          </span>
          <Button variant="outline" size="sm" className="h-9" onClick={() => setShowFilters((v) => !v)}>
            <Filter className="mr-1 size-4" /> Filters
          </Button>
        </div>
      </div>

      {/* smart filter bar */}
      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-tile">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 sm:flex sm:flex-wrap sm:justify-between">
          <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-card-foreground">
            <Filter className="size-4 shrink-0 text-primary" />
            <span className="truncate">Smart filters</span>
            {activeChips.length ? (
              <Badge variant="secondary" className="shrink-0">
                {activeChips.length}
              </Badge>
            ) : (
              <span className="shrink-0 text-xs font-normal text-muted-foreground">All data</span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute top-2.5 left-2 size-4 text-muted-foreground" />
              <Input
                value={filters.search}
                onChange={(e) => set({ search: e.target.value })}
                placeholder="Search document, customer, material"
                className="h-9 w-56 pl-8 lg:w-72"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              disabled={!activeChips.length}
              onClick={() => setFilters(emptySdFilters)}
            >
              <RotateCcw className="mr-1 size-3.5" /> Reset
            </Button>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-expanded={showFilters}
              aria-label={showFilters ? "Collapse filters" : "Expand filters"}
            >
              <ChevronDown
                className={`size-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>

        {showFilters ? (
          <div className="space-y-3 border-t border-border bg-muted/30 px-4 py-3">
            <div className="relative sm:hidden">
              <Search className="pointer-events-none absolute top-2.5 left-2 size-4 text-muted-foreground" />
              <Input
                value={filters.search}
                onChange={(e) => set({ search: e.target.value })}
                placeholder="Search document, customer, material"
                className="h-9 w-full pl-8"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Quick range</span>
              {QUICK_RANGES.map((preset) => {
                const range = preset.range();
                const active = filters.from === range.from && filters.to === range.to;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => set(active ? { from: "", to: "" } : range)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
              {filters.from || filters.to ? (
                <button
                  type="button"
                  onClick={() => set({ from: "", to: "" })}
                  className="rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear dates
                </button>
              ) : null}
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <label className="min-w-0 text-xs font-medium text-muted-foreground">
                Posting from
                <Input
                  type="date"
                  value={filters.from}
                  max={filters.to || undefined}
                  onChange={(e) => set({ from: e.target.value })}
                  className="mt-1 h-9 w-full pr-2 font-normal text-foreground [&::-webkit-calendar-picker-indicator]:mr-0"
                />
              </label>
              <label className="min-w-0 text-xs font-medium text-muted-foreground">
                Posting to
                <Input
                  type="date"
                  value={filters.to}
                  min={filters.from || undefined}
                  onChange={(e) => set({ to: e.target.value })}
                  className="mt-1 h-9 w-full pr-2 font-normal text-foreground [&::-webkit-calendar-picker-indicator]:mr-0"
                />
              </label>
              {SHOW_PLANT_FILTER ? (
                <label className="min-w-0 text-xs font-medium text-muted-foreground">
                  Plant
                  <div className="mt-1">
                    <MultiSelect
                      options={toOptions(opts.plants)}
                      selected={filters.plants}
                      onChange={(next) => set({ plants: next })}
                    />
                  </div>
                </label>
              ) : null}
              <label className="min-w-0 text-xs font-medium text-muted-foreground md:col-span-2 lg:col-span-2">
                Profit centre
                <div className="mt-1">
                  <MultiSelect
                    options={toOptions(opts.profitCentres)}
                    selected={filters.profitCentres}
                    onChange={(next) => set({ profitCentres: next })}
                  />
                </div>
              </label>
            </div>

            <p className="text-xs text-muted-foreground">
              Showing {NUM(rows.length)} of {NUM(all.length)} posting lines
            </p>
          </div>
        ) : null}


        {activeChips.length ? (
          <div className="flex flex-wrap gap-2 border-t border-border px-4 py-2">
            {activeChips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={chip.clear}
                className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {chip.label} ✕
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Source: ZFISALES_DETAIL · {NUM(all.length)} synced lines · last synced{" "}
          {formatDateTimeISTLabel(sync?.lastSyncedAt)}
          {sync?.lastStatus && sync.lastStatus !== "success" ? (
            <span className="text-destructive"> · last run {sync.lastStatus}</span>
          ) : null}
        </p>
        <div className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 p-1">
          {SALES_TYPE_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setSalesTypeTab(tab);
                setSelectedMainGroup(null);
              }}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                salesTypeTab === tab
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>


      {!all.length ? (
        <section className="rounded-md border border-border bg-card p-10 text-center shadow-tile">
          <h2 className="text-lg font-medium">No SAP data yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            ZFISALES_DETAIL is empty. Once the scheduled SAP sync stores document lines, this dashboard
            fills in automatically.
          </p>
        </section>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard
              label="Total Sales (Amount)"
              value={INRC(totalRevenue)}
              tone={0}
              icon={IndianRupee}
              delta={analytics.deltas.revenue}
              caption="Filtered postings · click for details"
              onClick={() => setFocus(focus === "revenue" ? null : "revenue")}
              active={focus === "revenue"}
            />
            <KpiCard
              label="Sales Growth %"
              value={
                analytics.kpis.momPct != null
                  ? `${analytics.kpis.momPct >= 0 ? "+" : ""}${analytics.kpis.momPct.toFixed(1)}%`
                  : "—"
              }
              tone={analytics.kpis.momPct != null && analytics.kpis.momPct < 0 ? 5 : 4}
              icon={analytics.kpis.momPct != null && analytics.kpis.momPct < 0 ? TrendingDown : TrendingUp}
              caption={analytics.kpis.momLabel}
            />
            <KpiCard
              label="Total Quantity"
              value={QTY(analytics.kpis.quantity)}
              tone={3}
              icon={Boxes}
              delta={analytics.deltas.quantity}
              caption={`Units billed${topUnit ? ` (${topUnit})` : ""}`}
            />
            <KpiCard
              label="Active Customers"
              value={NUM(analytics.kpis.customers)}
              tone={2}
              icon={Users}
              delta={analytics.deltas.customers}
              caption="Billed in selection · click for details"
              onClick={() => setFocus(focus === "customers" ? null : "customers")}
              active={focus === "customers"}
            />
            <KpiCard
              label="Revenue / AH"
              value={`₹${analytics.kpis.revenuePerAh.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
              tone={1}
              icon={BatteryCharging}
              delta={analytics.deltas.revenuePerAh}
              caption={`AH sold: ${compact(analytics.kpis.totalAh)}`}
            />
            <KpiCard
              label="Avg. Revenue / Customer"
              value={INRC(analytics.kpis.revenuePerCustomer)}
              tone={5}
              icon={Gauge}
              delta={analytics.deltas.revenuePerCustomer}
              caption="Sales per billed customer"
            />
          </div>


          {focus ? (
            <FocusTable
              title={focus === "revenue" ? "Total Sales by profit centre & customer" : "Billed Customers by document"}
              headers={focusHeaders}
              rows={focusRows}
              onBack={() => setFocus(null)}
              onExport={exportFocus}
            />
          ) : (
            <>
          {/* Row 2 — trend, segment mix, top profit centres */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel
              title="Sales Trend (Amount)"
              accent={1}
              expandable
              actions={
                <div className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 p-0.5">
                  {TREND_MODES.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTrendMode(mode)}
                      className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                        trendMode === mode
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              }
            >
              {(full: boolean) => (
                <div className={full ? "flex h-full flex-col" : ""}>
                  <div className="mb-1 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="h-0.5 w-5 rounded" style={{ background: "var(--kpi-1)" }} />
                      Current period ({trend.cy})
                    </span>
                    {trend.py ? (
                      <span className="flex items-center gap-1.5">
                        <span
                          className="h-0 w-5 border-t-2 border-dashed"
                          style={{ borderColor: "var(--color-muted-foreground)" }}
                        />
                        Previous period ({trend.py})
                      </span>
                    ) : null}
                    <span className="ml-auto">Amount (₹)</span>
                  </div>
                  <div className={full ? "min-h-0 flex-1" : ""}>
                    <ResponsiveContainer width="100%" height={full ? "100%" : 290}>
                      <ComposedChart data={trend.rows} margin={{ top: 18, left: 0, right: 8 }}>
                        <CartesianGrid strokeDasharray="2 6" stroke="var(--color-border)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                        <YAxis
                          tickFormatter={axisCompact}
                          tick={{ fontSize: 11 }}
                          width={70}
                          stroke="var(--color-muted-foreground)"
                        />
                        <Tooltip {...tooltipStyle} formatter={(v: number) => INRC(v)} />
                        <Line
                          type="monotone"
                          dataKey="current"
                          name="Current period"
                          stroke="var(--kpi-1)"
                          strokeWidth={2.5}
                          dot={{ r: 3 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="previous"
                          name="Previous period"
                          stroke="var(--color-muted-foreground)"
                          strokeDasharray="5 5"
                          strokeWidth={2}
                          dot={{ r: 2.5 }}
                          connectNulls
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </Panel>

            <Panel title="Sales by Segment (Amount)" accent={2} expandable>
              <SegmentDonut items={analytics.bySegment} total={totalRevenue} />
            </Panel>

            <Panel title="Top 10 Profit Centres by Amount" accent={4} expandable>
              {(full: boolean) => <BarList items={analytics.topProfitCentres} tone={0} full={full} />}
            </Panel>
          </div>

          {/* Row 3 — customers, pareto, main group */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Top 10 Customers by Amount" accent={2} expandable>
              {(full: boolean) => <BarList items={analytics.topCustomers} tone={1} full={full} />}
            </Panel>

            <Panel title="Customer Contribution (Pareto)" accent={1} expandable>
              {(full: boolean) => (
                <ResponsiveContainer width="100%" height={full ? "100%" : 300}>
                  <ComposedChart data={analytics.pareto} margin={{ top: 24, left: 4, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                    <YAxis
                      yAxisId="left"
                      width={64}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v: number) => axisCompact(v)}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      width={44}
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "#f97316" }}
                      tickFormatter={(v: number) => `${Math.round(v)}%`}
                    />
                    <Tooltip
                      {...tooltipStyle}
                      formatter={(value: number, name: string) =>
                        name === "Cumulative %" ? `${value.toFixed(1)}%` : INRC(value)
                      }
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="value"
                      name="Sales amount"
                      fill="var(--kpi-1)"
                      radius={[3, 3, 0, 0]}
                    >
                      <LabelList
                        dataKey="value"
                        position="top"
                        style={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                        formatter={(v: number) => compact(v)}
                      />
                    </Bar>
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="cumulativePct"
                      name="Cumulative %"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    >
                      <LabelList
                        dataKey="cumulativePct"
                        position="top"
                        style={{ fontSize: 10, fill: "#f97316", fontWeight: 600 }}
                        formatter={(v: number) => `${v.toFixed(0)}%`}
                      />
                    </Line>
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </Panel>

            <Panel title="Sales by Main Group (Amount)" accent={5} expandable>
              {(full: boolean) => (
                <MainGroupTreemap
                  items={analytics.byMainGroup}
                  subGroups={analytics.subGroupsByMainGroup}
                  full={full}
                  selected={selectedMainGroup}
                  onSelect={setSelectedMainGroup}
                />
              )}
            </Panel>
          </div>

          {/* Row 4 — sales vs quantity, alerts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Sales vs Quantity Trend" accent={3} expandable>
              {(full: boolean) => (
                <div className={full ? "flex h-full flex-col" : ""}>
                  <div className="mb-1 flex items-center gap-4 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="h-0.5 w-5 rounded" style={{ background: "var(--kpi-1)" }} />
                      Amount (₹)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-0.5 w-5 rounded" style={{ background: "var(--kpi-2)" }} />
                      Quantity
                    </span>
                  </div>
                  <div className={full ? "min-h-0 flex-1" : ""}>
                    <ResponsiveContainer width="100%" height={full ? "100%" : 280}>
                      <ComposedChart data={salesVsQty} margin={{ top: 16, left: 0, right: 8 }}>
                        <CartesianGrid strokeDasharray="2 6" stroke="var(--color-border)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                        <YAxis
                          tickFormatter={axisCompact}
                          tick={{ fontSize: 11 }}
                          width={70}
                          stroke="var(--color-muted-foreground)"
                        />
                        <YAxis
                          yAxisId="qty"
                          orientation="right"
                          tickFormatter={axisCompact}
                          tick={{ fontSize: 11 }}
                          width={60}
                          stroke="var(--color-muted-foreground)"
                        />
                        <Tooltip
                          {...tooltipStyle}
                          formatter={(v: number, n: string) => [n === "Quantity" ? NUM(v) : INRC(v), n]}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          name="Amount"
                          stroke="var(--kpi-1)"
                          strokeWidth={2.5}
                          dot={{ r: 3 }}
                        />
                        <Line
                          yAxisId="qty"
                          type="monotone"
                          dataKey="quantity"
                          name="Quantity"
                          stroke="var(--kpi-2)"
                          strokeWidth={2.5}
                          dot={{ r: 3 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </Panel>

            <Panel title="Management Alerts" accent={5}>
              <ul className="space-y-2.5">
                {analytics.alerts.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span
                      className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold"
                      style={{
                        background:
                          a.tone === "down"
                            ? "color-mix(in oklab, #dc2626 15%, transparent)"
                            : a.tone === "warn"
                              ? "color-mix(in oklab, #f59e0b 20%, transparent)"
                              : "color-mix(in oklab, #16a34a 18%, transparent)",
                        color: a.tone === "down" ? "#dc2626" : a.tone === "warn" ? "#b45309" : "#16a34a",
                      }}
                    >
                      {a.tone === "down" ? "↓" : a.tone === "warn" ? "!" : "↑"}
                    </span>
                    <span className="text-muted-foreground">{a.text}</span>
                  </li>
                ))}
                {analytics.alerts.length === 0 ? (
                  <li className="text-sm text-muted-foreground">No alerts for this selection.</li>
                ) : null}
              </ul>
            </Panel>
          </div>

          {/* Additional analysis kept below the management view */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Top 10 Materials" accent={3} expandable>
              {(full: boolean) => <BarList items={analytics.topMaterials} tone={2} full={full} />}
            </Panel>

            <Panel title="Top 10 Sales Employees" accent={2} expandable>
              {(full: boolean) => <BarList items={analytics.topSalesEmployees} tone={1} full={full} />}
            </Panel>

            <Panel title="Sales mix by type" accent={2} expandable>
              {(full: boolean) => (
                <div className={full ? "flex h-full flex-col" : ""}>
                  <div className={full ? "min-h-0 flex-1" : ""}>
                    <MixBars
                      items={analytics.mixByType}
                      total={totalRevenue}
                      {...(full ? { height: "100%" as const } : {})}
                    />
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {analytics.mixByType.map((m, i) => (
                      <div key={m.name} className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2 rounded-full"
                            style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                          />
                          {m.name || "—"}
                        </span>
                        <span className="tabular">{INRC(m.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Panel>
          </div>

          <div className="grid gap-4">
            <Panel title="Main Group vs Sub Group (Amount)" accent={3} expandable>
              {(full: boolean) => (
                <MainGroupBars
                  items={analytics.byMainGroup}
                  subGroups={analytics.subGroupsByMainGroup}
                  full={full}
                  selected={selectedMainGroup}
                  onSelect={setSelectedMainGroup}
                />
              )}
            </Panel>
          </div>





          <LinesTable
            rows={filtered}
            onExport={exportRows}
            pcColors={pcColors.map}
            pcLegend={pcLegend}
          />
            </>
          )}
        </>
      )}
    </div>
  );
}
