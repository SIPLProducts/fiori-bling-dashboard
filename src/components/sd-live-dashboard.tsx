import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
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
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CalendarDays,
  Zap,
  BarChart3,
  Target,
  Trash2,
} from "lucide-react";

import { Panel } from "@/components/report-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { buildDynamicColorMap } from "@/lib/chart-colors";
import { MultiSelect } from "@/components/multi-select";
import { downloadCsv, exportDashboardPdf } from "@/lib/chart-export";
import {
  readSharedSalesFilters,
  subscribeSharedSalesFilters,
  writeSharedSalesFilters,
} from "@/lib/shared-sales-filters";
import {
  applySdFilters,
  buildSdAnalytics,
  buildQuarterSummaries,
  currentFiscalYear,
  emptySdFilters,
  fetchSdLines,
  fiscalYearForDate,
  limitModelPerformance,
  uniqueValues,
  type NamedTotal,
  type ModelPerformance,
  type QuarterSummary,
  type SdFilters,
  type SdLine,
} from "@/lib/sd-live";
import { useLaunchpad } from "@/lib/use-launchpad";
import {
  listSalesRevenueTargets,
  removeSalesRevenueTarget,
  saveSalesRevenueTarget,
  type SalesRevenueTarget,
} from "@/lib/sales-targets.functions";

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

const LAKHS = (value: number) =>
  `${(value / 1e5).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\u00A0L`;
const LAKHS_VALUE = (value: number) =>
  (value / 1e5).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const CRORES = (value: number) =>
  `${(value / 1e7).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\u00A0Cr`;
const CRORES_VALUE = (value: number) =>
  `₹${(value / 1e7).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const INR_CRORES = (value: number) => `₹${CRORES(value)}`;
const PER_AH = (value: number) =>
  `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/AH`;

/* ---- UI visibility flags: hidden elements keep their code intact; flip ----
 * ---- a flag back to true to show the element again. ---------------------- */
const SHOW_QUANTITY_TILE = false;
const SHOW_AVG_ORDER_VALUE_TILE = false;
const SHOW_TOP_PROFIT_CENTRE_TILE = false;
const SHOW_PLANT_FILTER = false;
/** Plant options removed from the Plant dropdown list. */
const PLANT_OPTIONS_EXCLUDED = ["1200"];
const SALES_TYPE_TABS = ["All", "Domestic", "Services", "Exports"] as const;
const FISCAL_QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;

const KPI_TONES = [
  "var(--kpi-1)",
  "var(--kpi-2)",
  "var(--kpi-3)",
  "var(--kpi-4)",
  "var(--kpi-5)",
  "var(--kpi-6)",
];

const CHART_COLORS = KPI_TONES;

type ExactHoverBarShapeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  payload?: { name?: string };
  dataKey?: string;
};

/**
 * Preserve the measured segment while giving very small slices a usable
 * pointer target. Events bubble to Recharts' segment wrapper, so its tooltip
 * still receives the exact subgroup/division payload.
 */
function ExactHoverBarShape(rawProps: unknown) {
  const props = rawProps as ExactHoverBarShapeProps;
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const width = Math.max(0, Number(props.width ?? 0));
  const height = Math.max(0, Number(props.height ?? 0));
  const division = props.dataKey ?? "";
  const payload = props.payload as (Record<string, unknown> & { name?: string }) | undefined;
  const actualValues = payload?.["actualValues"] as Record<string, number> | undefined;
  const value = Number(actualValues?.[division] ?? payload?.[division] ?? 0);
  const counts = payload?.["counts"] as Record<string, number> | undefined;
  const count = counts?.[division] ?? 0;
  const hitHeight = count > 0 && height > 0 ? Math.max(height, 14) : 0;
  const hitY = y - (hitHeight - height) / 2;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={count > 0 ? props.fill : "transparent"}
        pointerEvents="none"
        data-chart-visible-segment="true"
        data-sub-group={props.payload?.name ?? ""}
        data-division={division}
        data-value={value}
      />
      {hitHeight > 0 ? (
        <rect
          x={x}
          y={hitY}
          width={width}
          height={hitHeight}
          fill="transparent"
           pointerEvents="all"
          data-chart-hit-target="true"
          data-sub-group={props.payload?.name ?? ""}
          data-division={division}
          data-value={value}
          data-count={count}
          data-total={Number(payload?.["total"] ?? 0)}
          data-actual-y={y}
          data-actual-height={height}
        />
      ) : null}
    </g>
  );
}

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


const QUICK_RANGES: { label: string; range: () => { from: string; to: string } }[] = [
  { label: "Last 7 days", range: () => ({ from: isoDaysAgo(7), to: isoDaysAgo(0) }) },
  { label: "Last 30 days", range: () => ({ from: isoDaysAgo(30), to: isoDaysAgo(0) }) },
  { label: "Last 90 days", range: () => ({ from: isoDaysAgo(90), to: isoDaysAgo(0) }) },
  {
    label: "This month",
    range: () => {
      const d = new Date();
      return { from: `${d.toISOString().slice(0, 7)}-01`, to: isoDaysAgo(0) };
    },
  },
  {
    label: "This year",
    range: () => {
      const fiscalYear = currentFiscalYear();
      return { from: `${fiscalYear}-04-01`, to: isoDaysAgo(0) };
    },
  },
];

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
      className={`group relative overflow-hidden rounded-xl border p-4 shadow-tile transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-tile-hover ${
        onClick ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" : ""
      }`}
      style={{
        background: `linear-gradient(145deg, color-mix(in oklab, ${color} 7%, var(--color-card)) 0%, var(--color-card) 68%)`,
        borderColor: `color-mix(in oklab, ${color} ${active ? "42%" : "20%"}, var(--color-border))`,
        boxShadow: active
          ? `0 0 0 2px color-mix(in oklab, ${color} 35%, transparent), var(--shadow-tile)`
          : undefined,
      }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: color }}
      />
      <div className="flex items-center gap-3">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-full ring-1 transition-transform duration-200 group-hover:scale-105"
          style={{
            background: `color-mix(in oklab, ${color} 15%, var(--color-card))`,
            color,
            boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${color} 18%, transparent)`,
          }}
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
            style={{ color: delta.pct >= 0 ? "var(--kpi-up)" : "var(--kpi-down)" }}
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

function QuarterCard({ summary, tone, active }: { summary: QuarterSummary; tone: number; active: boolean }) {
  const color = KPI_TONES[tone % KPI_TONES.length];
  const direction = summary.changePct == null ? "neutral" : summary.changePct >= 0 ? "up" : "down";
  const chartData = summary.trend.map((point) => ({ ...point, value: point.value / 1e7 }));
  return (
    <section
      className="relative min-w-0 overflow-hidden rounded-lg border bg-card p-3 shadow-tile"
      style={{
        borderColor: active ? color : "var(--color-border)",
        background: active
          ? `linear-gradient(145deg, color-mix(in oklab, ${color} 7%, var(--color-card)), var(--color-card))`
          : "var(--color-card)",
        boxShadow: active ? `0 0 0 2px color-mix(in oklab, ${color} 18%, transparent), var(--shadow-tile)` : undefined,
      }}
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5" style={{ background: color }} />
      <div className="flex items-center gap-2 pt-1">
        <span className="size-2 shrink-0 rounded-full" style={{ background: color }} />
        <p className="truncate text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Quarter {summary.quarter.slice(1)}</p>
        {active ? <Badge className="ml-auto px-1.5 py-0 text-[9px]">Active</Badge> : null}
        <BarChart3 className={`${active ? "" : "ml-auto"} size-4 shrink-0`} style={{ color }} />
      </div>
      <p className="tabular mt-2 truncate text-lg font-semibold text-card-foreground">{INRC(summary.amount)}</p>
      <p className="mt-1.5 flex min-w-0 items-center gap-1 text-[11px]">
        <span
          className="tabular shrink-0 rounded-full px-2 py-0.5 font-semibold"
          style={{ color: direction === "up" ? "var(--kpi-up)" : direction === "down" ? "var(--kpi-down)" : "var(--color-muted-foreground)" }}
        >
          {direction === "up" ? "↑" : direction === "down" ? "↓" : "—"}{summary.changePct == null ? "" : ` ${Math.abs(summary.changePct).toFixed(1)}%`}
        </span>
        <span className="truncate text-muted-foreground">{summary.comparisonLabel}</span>
      </p>
      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-[10px] text-muted-foreground">
        <span>{summary.periodLabel}</span>
        {summary.varianceAmount != null ? (
          <span className="tabular font-medium" style={{ color: direction === "up" ? "var(--kpi-up)" : "var(--kpi-down)" }}>
            {summary.varianceAmount >= 0 ? "+" : "−"}{CRORES(Math.abs(summary.varianceAmount))}
          </span>
        ) : null}
      </div>
      <div className="mt-1 h-12 overflow-hidden rounded-md bg-muted/40">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 7, right: 5, bottom: 2, left: 5 }}>
            <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

type SalesBreakdown = { label: string; value: number; color: string };

function fiscalYearLabel(fiscalYear: string) {
  return fiscalYear ? `FY ${fiscalYear}–${String(Number(fiscalYear) + 1).slice(-2)}` : "Filtered period";
}

function buildSalesBreakdown(items: NamedTotal[]): { named: SalesBreakdown[]; other: number } {
  const buckets = { domestic: 0, service: 0, exports: 0, other: 0 };
  for (const item of items) {
    const key = item.name.trim().toLowerCase();
    if (key === "domestic") buckets.domestic += item.value;
    else if (key === "service" || key === "services") buckets.service += item.value;
    else if (key === "export" || key === "exports") buckets.exports += item.value;
    else buckets.other += item.value;
  }
  return {
    named: [
      { label: "Domestic", value: buckets.domestic, color: "var(--kpi-1)" },
      { label: "Service", value: buckets.service, color: "var(--kpi-2)" },
      { label: "Exports", value: buckets.exports, color: "var(--kpi-3)" },
    ],
    other: buckets.other,
  };
}

function TotalSalesCard({
  amount,
  postingCount,
  fiscalYear,
  breakdown,
  target,
  onClick,
  active,
}: {
  amount: number;
  postingCount: number;
  fiscalYear: string;
  breakdown: { named: SalesBreakdown[]; other: number };
  target: number | null;
  onClick: () => void;
  active: boolean;
}) {
  const total = breakdown.named.reduce((sum, item) => sum + item.value, 0) + breakdown.other;
  const share = (value: number) => total === 0 ? 0 : (value / total) * 100;
  const achievement = target && target > 0 ? (amount / target) * 100 : null;
  return (
    <section
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onClick(); }}
      className="relative h-full min-w-0 cursor-pointer overflow-hidden rounded-lg border border-border bg-card p-4 shadow-tile transition-shadow hover:shadow-tile-hover"
      aria-pressed={active}
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-primary" />
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase text-muted-foreground">Total Sales · {fiscalYearLabel(fiscalYear)}</p>
        <span className="grid size-7 place-items-center rounded-md bg-primary/10 text-primary"><IndianRupee className="size-3.5" /></span>
      </div>
      <p className="tabular mt-3 text-2xl font-semibold text-card-foreground">{INR_CRORES(amount)}</p>
      <div className="mt-3 border-t border-border pt-3">
        <div className="grid grid-cols-3 gap-2">
          {breakdown.named.map((item) => (
            <div key={item.label} className="min-w-0">
              <p className="truncate text-[10px] text-muted-foreground">{item.label} · {share(item.value).toFixed(1)}%</p>
              <p className="tabular truncate text-[10px] font-semibold text-card-foreground">{CRORES(item.value)}</p>
            </div>
          ))}
        </div>
        <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-muted">
          {breakdown.named.map((item) => (
            <span key={item.label} style={{ width: `${Math.max(0, share(item.value))}%`, background: item.color }} />
          ))}
          {breakdown.other !== 0 ? <span style={{ width: `${Math.max(0, share(breakdown.other))}%`, background: "var(--color-muted-foreground)" }} /> : null}
        </div>
        {breakdown.other !== 0 ? <p className="mt-1 text-[10px] text-muted-foreground">Other sales types: {CRORES(breakdown.other)} ({share(breakdown.other).toFixed(1)}%)</p> : null}
      </div>
      <div className="mt-3 border-t border-border pt-2.5">
        <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
          <span>{target ? `Revenue target: ${INRC(target)}` : "Target not configured"}</span>
          {achievement != null ? <strong className="tabular text-foreground">{achievement.toFixed(1)}%</strong> : null}
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
          <span className="block h-full rounded-full bg-success" style={{ width: `${Math.min(100, Math.max(0, achievement ?? 0))}%` }} />
        </div>
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">Filtered postings <span className="tabular float-right font-semibold text-primary">{NUM(postingCount)} lines</span></p>
    </section>
  );
}

function RevenueTargetDialog({
  open,
  onOpenChange,
  fiscalYears,
  targets,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fiscalYears: string[];
  targets: SalesRevenueTarget[];
}) {
  const queryClient = useQueryClient();
  const saveTarget = useServerFn(saveSalesRevenueTarget);
  const removeTarget = useServerFn(removeSalesRevenueTarget);
  const [fiscalYear, setFiscalYear] = useState(fiscalYears[0] ?? currentFiscalYear());
  const existing = targets.find((target) => target.fiscalYear === fiscalYear);
  const [amountCrores, setAmountCrores] = useState("");

  useEffect(() => {
    setAmountCrores(existing ? String(existing.targetAmount / 1e7) : "");
  }, [existing, fiscalYear]);

  const save = useMutation({
    mutationFn: () => saveTarget({ data: { fiscalYear, targetAmount: Number(amountCrores) * 1e7 } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sales-revenue-targets"] });
      toast.success("Revenue target saved");
      onOpenChange(false);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to save target"),
  });
  const remove = useMutation({
    mutationFn: () => removeTarget({ data: { fiscalYear } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sales-revenue-targets"] });
      toast.success("Revenue target removed");
      onOpenChange(false);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to remove target"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revenue Targets</DialogTitle>
          <DialogDescription>Set the annual sales target for an April–March fiscal year.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-muted-foreground">Fiscal year
            <select className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" value={fiscalYear} onChange={(event) => setFiscalYear(event.target.value)}>
              {[...new Set([currentFiscalYear(), ...fiscalYears])].sort((a, b) => b.localeCompare(a)).map((year) => <option key={year} value={year}>{fiscalYearLabel(year)}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-muted-foreground">Annual target (Crores)
            <Input className="mt-1" type="number" min="0.01" step="0.01" value={amountCrores} onChange={(event) => setAmountCrores(event.target.value)} placeholder="e.g. 3500" />
          </label>
        </div>
        <DialogFooter>
          {existing ? <Button variant="destructive" onClick={() => remove.mutate()} disabled={remove.isPending}><Trash2 className="mr-1 size-4" />Remove</Button> : null}
          <Button onClick={() => save.mutate()} disabled={save.isPending || !(Number(amountCrores) > 0)}>{save.isPending ? "Saving…" : "Save target"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QuarterAnalysis({ summaries, onDownload, busy }: { summaries: QuarterSummary[]; onDownload: () => void; busy: boolean }) {
  const max = Math.max(1, ...summaries.flatMap((item) => [Math.abs(item.amount), Math.abs(item.baselineAmount ?? 0)]));
  const comparable = summaries.filter((item) => item.varianceAmount != null);
  const strongest = [...summaries].sort((a, b) => b.amount - a.amount)[0];
  const best = [...comparable].sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0))[0];
  const weakest = [...comparable].sort((a, b) => (a.changePct ?? 0) - (b.changePct ?? 0))[0];
  const averageVariance = comparable.length
    ? comparable.reduce((sum, item) => sum + (item.varianceAmount ?? 0), 0) / comparable.length
    : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
      <section className="rounded-lg border border-border bg-card p-4 shadow-tile">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border pb-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-card-foreground">Quarterly Trajectory &amp; Up/Down Variance Analysis</h3>
            <p className="text-xs text-muted-foreground">Actual sales against the automatic comparison baseline</p>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><span className="size-2 rounded-sm bg-primary" />Actual</span>
            <span className="inline-flex items-center gap-1"><span className="h-0 w-3 border-t border-dashed border-muted-foreground" />Baseline</span>
          </div>
        </div>
        <div className="mt-4 space-y-4">
          {summaries.map((item, index) => {
            const color = KPI_TONES[(index + 1) % KPI_TONES.length];
            const actualWidth = Math.max(item.amount ? 3 : 0, Math.min(100, (Math.abs(item.amount) / max) * 100));
            const baselineWidth = item.baselineAmount == null ? null : Math.min(100, (Math.abs(item.baselineAmount) / max) * 100);
            return (
              <div key={item.quarter} className="grid gap-2 sm:grid-cols-[7rem_minmax(0,1fr)_8rem] sm:items-center">
                <div>
                  <p className="text-xs font-semibold text-card-foreground">Quarter {item.quarter.slice(1)}</p>
                  <p className="text-[10px] text-muted-foreground">{item.periodLabel}</p>
                </div>
                <div className="relative h-6 overflow-hidden rounded-md bg-muted">
                  <span className="absolute inset-y-0 left-0 rounded-md" style={{ width: `${actualWidth}%`, background: color }} />
                  <span className="absolute inset-y-0 left-2 flex items-center text-[10px] font-semibold text-primary-foreground">{CRORES(item.amount)}</span>
                  {baselineWidth != null ? <span className="absolute inset-y-0 border-l-2 border-dashed border-foreground/60" style={{ left: `${baselineWidth}%` }} /> : null}
                </div>
                <div className="text-right text-xs font-semibold" style={{ color: item.varianceAmount == null ? "var(--color-muted-foreground)" : item.varianceAmount >= 0 ? "var(--kpi-up)" : "var(--kpi-down)" }}>
                  {item.varianceAmount == null ? "No baseline" : `${item.varianceAmount >= 0 ? "↑ +" : "↓ −"}${CRORES(Math.abs(item.varianceAmount))}`}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <span>{comparable.filter((item) => (item.varianceAmount ?? 0) > 0).length} quarters increased</span>
          {averageVariance != null ? <span>Average variance: <strong className="text-foreground">{averageVariance >= 0 ? "+" : "−"}{CRORES(Math.abs(averageVariance))}</strong></span> : null}
        </div>
      </section>
      <section className="flex flex-col rounded-lg border border-border bg-card p-4 shadow-tile">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Zap className="size-4 text-warning" />
          <h3 className="text-sm font-semibold text-card-foreground">Executive Insights</h3>
          <Badge variant="secondary" className="ml-auto text-[10px]">Live filters</Badge>
        </div>
        <div className="mt-3 flex-1 space-y-2.5">
          {strongest ? <div className="rounded-md border border-warning/30 bg-warning/5 p-3"><p className="text-xs font-semibold">Peak in {strongest.quarter} ({CRORES(strongest.amount)})</p><p className="mt-1 text-[11px] text-muted-foreground">Highest sales quarter in the current filtered period.</p></div> : null}
          {best ? <div className="rounded-md border border-success/30 bg-success/5 p-3"><p className="text-xs font-semibold">Strongest improvement · {best.quarter}</p><p className="mt-1 text-[11px] text-muted-foreground">{Math.abs(best.changePct ?? 0).toFixed(1)}% {best.changePct != null && best.changePct >= 0 ? "above" : "below"} {best.comparisonLabel.replace("vs ", "")}.</p></div> : null}
          {weakest && weakest !== best ? <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3"><p className="text-xs font-semibold">Largest decline · {weakest.quarter}</p><p className="mt-1 text-[11px] text-muted-foreground">{Math.abs(weakest.changePct ?? 0).toFixed(1)}% below {weakest.comparisonLabel.replace("vs ", "")}.</p></div> : null}
          {!comparable.length ? <p className="py-6 text-center text-xs text-muted-foreground">Comparison history is not available for this selection.</p> : null}
        </div>
        <Button className="mt-4 w-full" onClick={onDownload} disabled={busy}>
          <BarChart3 className="mr-2 size-4" /> {busy ? "Preparing…" : "Generate Detailed Variance Report"}
        </Button>
      </section>
    </div>
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
    background: "var(--card)",
    color: "var(--card-foreground)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    fontSize: 12,
    boxShadow: "var(--shadow-tile-hover)",
  },
  labelStyle: { color: "var(--card-foreground)", fontWeight: 600 },
  itemStyle: { color: "var(--muted-foreground)" },
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
    <div className="cxo-chart-surface">
    <ResponsiveContainer width="100%" height={height ?? Math.max(220, data.length * 34)}>

      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 76 }}>
        <CartesianGrid strokeDasharray="2 6" stroke="var(--chart-grid-line)" horizontal={false} />
        <XAxis type="number" tickFormatter={compact} tick={{ fontSize: 10, fill: "var(--chart-axis-label)" }} stroke="var(--chart-axis-line)" tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={230}
          interval={0}
          tickMargin={4}
          tickFormatter={(v: string) => (v && v.length > 44 ? `${v.slice(0, 42)}…` : v || "—")}
          tick={{ fontSize: 10, fill: "var(--chart-axis-label)" }}
          stroke="var(--chart-axis-line)"
          tickLine={false}
        />
        <Tooltip {...tooltipStyle} formatter={(v: number) => [INRC(v), valueLabel]} />
        <Bar dataKey="value" radius={[3, 3, 3, 3]} fill={color}>
          <LabelList
            dataKey="value"
            position="right"
            formatter={(v: number) => compact(v)}
            fontSize={10}
            fill="var(--chart-label-strong)"
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
    </div>
  );
}

type ModelLimit = 10 | 20 | "all";

function SalesByModelChart({
  items,
  limit,
  full,
}: {
  items: ModelPerformance[];
  limit: ModelLimit;
  full: boolean;
}) {
  const data = limitModelPerformance(items, limit);
  if (!data.length)
    return <p className="py-10 text-center text-sm text-muted-foreground">No models match the current filters.</p>;

  const chartHeight = Math.max(full ? 520 : 320, data.length * 42);
  const rateByModel = new Map(data.map((item) => [item.model, item.perAhRate]));
  const axisTick = ({ x = 0, y = 0, payload }: { x?: number; y?: number; payload?: { value?: string } }) => {
    const model = payload?.value ?? "Unassigned";
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={-8} y={-3} textAnchor="end" fill="var(--chart-axis-label)" fontSize={11}>
          {model.length > 22 ? `${model.slice(0, 21)}…` : model}
        </text>
        <text x={-8} y={11} textAnchor="end" fill="var(--color-muted-foreground)" fontSize={9}>
          {PER_AH(rateByModel.get(model) ?? 0)}
        </text>
      </g>
    );
  };

  return (
    <div className={`cxo-chart-surface overflow-auto ${full ? "h-full" : "max-h-[720px]"}`}>
      <div style={{ height: chartHeight, minWidth: 720 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data} margin={{ top: 8, right: 104, bottom: 18, left: 16 }}>
            <CartesianGrid strokeDasharray="2 6" stroke="var(--chart-grid-line)" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(value: number) => `${(value / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`}
              tick={{ fontSize: 10, fill: "var(--chart-axis-label)" }}
              stroke="var(--chart-axis-line)"
              tickLine={false}
              label={{ value: "Amount in local cur. (₹ Cr)", position: "insideBottom", offset: -12, fill: "var(--chart-axis-label)", fontSize: 10 }}
            />
            <YAxis
              type="category"
              dataKey="model"
              width={180}
              interval={0}
              tick={axisTick}
              stroke="var(--chart-axis-line)"
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "var(--chart-hover-fill)" }}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as ModelPerformance | undefined;
                if (!active || !point) return null;
                return (
                  <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
                    <p className="mb-1.5 font-semibold">{point.model}</p>
                    <div className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1">
                      <span className="text-muted-foreground">Sales Amount</span>
                      <span className="text-right font-medium tabular-nums">{INR_CRORES(point.totalAmount)}</span>
                      <span className="text-muted-foreground">Total AH</span>
                      <span className="text-right font-medium tabular-nums">{LAKHS(point.totalAh)} AH</span>
                      <span className="text-muted-foreground">Realization Rate</span>
                      <span className="text-right font-medium tabular-nums">{PER_AH(point.perAhRate).replace("/AH", " / AH")}</span>
                      <span className="text-muted-foreground">Total Orders / Records</span>
                      <span className="text-right font-medium tabular-nums">{NUM(point.recordCount)}</span>
                      <span className="text-muted-foreground">Share of Total AH Sales</span>
                      <span className="text-right font-medium tabular-nums">{point.salesSharePct.toFixed(2)}%</span>
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="totalAmount" name="Sales Amount" fill="var(--kpi-1)" radius={[0, 3, 3, 0]} maxBarSize={28}>
              <LabelList
                dataKey="totalAmount"
                position="right"
                formatter={(value: number) => INR_CRORES(value)}
                fontSize={10}
                fill="var(--chart-label-strong)"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
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
  onSelect,
  valueFormatter = INRC,
}: {
  items: { name: string; value: number; count?: number }[];
  tone?: number;
  full?: boolean;
  onSelect?: (name: string) => void;
  valueFormatter?: (value: number) => string;
}) {
  if (!items.length) return <p className="py-10 text-center text-sm text-muted-foreground">No data</p>;
  const max = Math.max(...items.map((i) => i.value), 1);
  const tip = (item: { name: string; value: number; count?: number }) =>
    `${item.name || "—"}\n${valueFormatter(item.value)}${
      item.count != null ? `\n${item.count.toLocaleString("en-IN")} records` : ""
    }`;
  return (
    <div className={full ? "flex h-full flex-col gap-1.5" : "space-y-1.5"}>
      <div className="flex items-center justify-end gap-3 text-[11px] font-medium text-muted-foreground">
        <span>Amount</span>
        {full ? <span className="w-20 shrink-0 text-right">Records</span> : null}
      </div>
      {items.map((item) => (
        <button type="button" key={item.name} onClick={() => onSelect?.(item.name)} className={`flex w-full items-center gap-3 text-left ${full ? "min-h-0 flex-1" : ""} ${onSelect ? "cursor-pointer rounded-sm hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" : "cursor-default"}`} title={tip(item)}>
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
            {valueFormatter(item.value)}
          </span>
          {full ? (
            <span
              className="tabular w-20 shrink-0 whitespace-nowrap text-right text-[11px] text-muted-foreground"
              title={tip(item)}
            >
              {item.count != null ? item.count.toLocaleString("en-IN") : "—"}
            </span>
          ) : null}
        </button>
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
    <div className="cxo-chart-surface">
    <ResponsiveContainer width="100%" height={height ?? Math.max(220, items.length * 46)}>

      <BarChart data={items} layout="vertical" margin={{ left: 0, right: 140, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="2 6" stroke="var(--chart-grid-line)" horizontal={false} />
        <XAxis type="number" tickFormatter={(value: number) => (value / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 1 })} tick={{ fontSize: 10, fill: "var(--chart-axis-label)" }} stroke="var(--chart-axis-line)" tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fontSize: 10, fill: "var(--chart-axis-label)" }}
          stroke="var(--chart-axis-line)"
          tickLine={false}
        />
        <Tooltip
          {...tooltipStyle}
          formatter={(v: number, _n: string, p: { payload?: { name?: string } }) => [
            `${CRORES_VALUE(v)} · ${total ? ((v / total) * 100).toFixed(1) : "0"}%`,
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
              `${CRORES_VALUE(v)} (${total ? ((v / total) * 100).toFixed(1) : "0"}%)`
            }
            fontSize={11}
            fontWeight={600}
            fill="var(--chart-label-strong)"
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
    </div>
  );
}

function BsarkBars({ items, unassigned }: { items: NamedTotal[]; unassigned: number }) {
  if (!items.length)
    return <p className="py-10 text-center text-sm text-muted-foreground">No BSARK data</p>;
  return (
    <div>
      <div className="cxo-chart-surface h-[230px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={items} margin={{ top: 20, right: 12, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="2 6" stroke="var(--chart-grid-line)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--chart-axis-label)" }} stroke="var(--chart-axis-line)" tickLine={false} />
            <YAxis width={58} tickFormatter={axisCompact} tick={{ fontSize: 10, fill: "var(--chart-axis-label)" }} stroke="var(--chart-axis-line)" tickLine={false} />
            <Tooltip
              {...tooltipStyle}
              formatter={(value: number, _name: string, item: { payload?: NamedTotal }) => [
                `${INRC(value)} · ${(item.payload?.count ?? 0).toLocaleString("en-IN")} rows`,
                item.payload?.name ?? "BSARK",
              ]}
            />
            <Bar dataKey="value" name="Sales amount" radius={[4, 4, 0, 0]}>
              {items.map((item, index) => (
                <Cell key={item.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
              <LabelList dataKey="value" position="top" formatter={(value: number) => compact(value)} fontSize={10} fill="var(--chart-label-strong)" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        {items.map((item) => (
          <span key={item.name}><strong className="text-foreground">{item.name}</strong> · {item.count.toLocaleString("en-IN")} rows</span>
        ))}
        {unassigned > 0 ? <span>Unassigned · {unassigned.toLocaleString("en-IN")} rows</span> : null}
      </div>
    </div>
  );
}

const SEGMENT_PAGE = 6;

/** X/Y bar chart of main groups; clicking a bar drills into that group's sub groups. */
function MainGroupBars({
  items,
  subGroups,
  divisionsByMainGroup,
  divisionsBySubGroup,
  full = false,
  selected,
  onSelect,
}: {
  items: NamedTotal[];
  subGroups: Record<string, NamedTotal[]>;
  divisionsByMainGroup: Record<string, NamedTotal[]>;
  divisionsBySubGroup: Record<string, Record<string, NamedTotal[]>>;
  full?: boolean;
  selected: string | null;
  onSelect: (name: string | null) => void;
}) {
  const exactTooltipRef = useRef<HTMLDivElement>(null);
  const [exactHover, setExactHover] = useState<{
    subgroup: string;
    division: string;
    value: number;
    count: number;
    total: number;
    clientX: number;
    clientY: number;
  } | null>(null);
  const [exactTooltipPosition, setExactTooltipPosition] = useState<{ left: number; top: number } | null>(null);
  const categories = selected ? (subGroups[selected] ?? []) : items;
  const divisionRows = selected ? (divisionsBySubGroup[selected] ?? {}) : divisionsByMainGroup;
  const divisions = useMemo(() => {
    if (!selected) return [];
    const totals = new Map<string, number>();
    for (const category of categories) {
      for (const division of divisionRows[category.name] ?? []) {
        totals.set(division.name, (totals.get(division.name) ?? 0) + division.value);
      }
    }
    return [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
  }, [categories, divisionRows, selected]);
  const divisionColors = useMemo(() => buildDynamicColorMap(divisions), [divisions]);
  const minimumVisibleValue = useMemo(() => {
    if (!selected) return 0;
    const largestTotal = Math.max(...categories.map((category) => Math.abs(category.value)), 0);
    // Reserve roughly four plot pixels for each recorded tiny or zero slice.
    // Real amounts remain in actualValues and continue to drive totals/tooltips.
    return largestTotal > 0 ? largestTotal / 50 : 1;
  }, [categories, selected]);
  const data = useMemo(
    () =>
      categories.map((category) => {
        const row: Record<string, unknown> = {
          name: category.name,
          total: category.value,
          value: category.value,
          count: category.count,
          counts: {},
          actualValues: {},
        };
        if (selected) {
          for (const division of divisionRows[category.name] ?? []) {
            // Give every recorded pair its own visible stacked slice. The real
            // amount stays separate so labels, totals, filters, and tooltips
            // remain exact even when a tiny or zero value receives a visual floor.
            row[division.name] = division.value < 0
              ? -Math.max(Math.abs(division.value), minimumVisibleValue)
              : Math.max(division.value, minimumVisibleValue);
            const counts = row["counts"] as Record<string, number>;
            counts[division.name] = division.count;
            const actualValues = row["actualValues"] as Record<string, number>;
            actualValues[division.name] = division.value;
          }
        }
        return row;
      }),
    [categories, divisionRows, minimumVisibleValue, selected],
  );
  // Use the full panel before scrolling, then add only the compact width needed
  // for each extra sub group. This keeps every group visible without the large
  // empty gaps created by a fixed 66px allocation per category.
  const minimumChartWidth = Math.max(560, categories.length * (selected ? 48 : 72));
  const chartWidth = `max(100%, ${minimumChartWidth}px)`;
  const legendHeight = selected ? Math.max(48, Math.ceil(divisions.length / 6) * 24 + 16) : 0;
  useEffect(() => {
    const tooltip = exactTooltipRef.current;
    if (!exactHover || !tooltip) {
      setExactTooltipPosition(null);
      return;
    }

    const margin = 8;
    const gap = 12;
    const { width, height } = tooltip.getBoundingClientRect();
    const preferredLeft = exactHover.clientX + gap;
    const preferredTop = exactHover.clientY + gap;
    const left = preferredLeft + width <= window.innerWidth - margin
      ? preferredLeft
      : exactHover.clientX - width - gap;
    const top = preferredTop + height <= window.innerHeight - margin
      ? preferredTop
      : exactHover.clientY - height - gap;

    setExactTooltipPosition({
      left: Math.max(margin, Math.min(left, window.innerWidth - width - margin)),
      top: Math.max(margin, Math.min(top, window.innerHeight - height - margin)),
    });
  }, [exactHover]);
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
        fill="var(--chart-axis-label)"
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
    const item = categories[index];
    return (
      <text
        x={x + width / 2}
        y={y - 4}
        textAnchor="middle"
        fontSize={10}
        fill="var(--chart-label-strong)"
        style={{ cursor: selected ? "default" : "pointer" }}
        onClick={() => item && drill(item.name)}
      >
        {compact(Number(value ?? 0))}
      </text>
    );
  };
  const trackExactSegment = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!selected) return;
    const pointerX = event.clientX;
    const pointerY = event.clientY;
    const targets = [...event.currentTarget.querySelectorAll<SVGRectElement>('[data-chart-hit-target="true"]')];
    const candidates = targets
      .map((target) => {
        const box = target.getBoundingClientRect();
        const visibleSegment = target.previousElementSibling;
        const visibleBox = visibleSegment instanceof SVGGraphicsElement
          ? visibleSegment.getBoundingClientRect()
          : box;
        const actualTop = visibleBox.top;
        const actualBottom = visibleBox.bottom;
        const insideX = pointerX >= box.left && pointerX <= box.right;
        const insideActual = pointerX >= visibleBox.left
          && pointerX <= visibleBox.right
          && pointerY >= actualTop
          && pointerY <= actualBottom;
        const distance = insideActual
          ? 0
          : Math.min(Math.abs(pointerY - actualTop), Math.abs(pointerY - actualBottom));
        return { target, insideX, insideActual, distance };
      })
      .filter((candidate) => candidate.insideX)
      .sort((a, b) => Number(b.insideActual) - Number(a.insideActual) || a.distance - b.distance);
    const exactCandidate = candidates.find((candidate) => candidate.insideActual);
    const nearest = exactCandidate?.target ?? candidates[0]?.target;
    const nearestDistance = exactCandidate ? 0 : candidates[0]?.distance;
    if (!nearest || nearestDistance === undefined || nearestDistance > 8) {
      setExactHover(null);
      return;
    }
    setExactHover({
      subgroup: nearest.dataset["subGroup"] ?? "Unassigned",
      division: nearest.dataset["division"] ?? "Unassigned",
      value: Number(nearest.dataset["value"] ?? 0),
      count: Number(nearest.dataset["count"] ?? 0),
      total: Number(nearest.dataset["total"] ?? 0),
      clientX: pointerX,
      clientY: pointerY,
    });
  };
  if (!items.length) return <p className="py-10 text-center text-sm text-muted-foreground">No data</p>;
  return (
    <div className={full ? "flex h-full flex-col" : ""}>
      <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <div className="flex min-w-0 items-center gap-2">
          {selected ? (
            <>
              <Button
                type="button"
                variant={full ? "default" : "outline"}
                size="sm"
                className="h-7 shrink-0 px-2 text-[11px]"
                onClick={() => onSelect(null)}
              >
                <ChevronLeft className="size-3.5" />
                Back to Main Group
              </Button>
              <span className="min-w-0 truncate text-foreground">Selected main group · {selected}</span>
            </>
          ) : (
            <span>Click a bar to see its sub groups</span>
          )}
        </div>
        <span className="tabular shrink-0">₹{compact(categories.reduce((sum, item) => sum + item.value, 0))}</span>
      </div>
      <div
        className={`cxo-chart-surface overflow-x-auto ${full ? "min-h-0 flex-1" : ""}`}
        onPointerMoveCapture={trackExactSegment}
        onMouseLeave={() => setExactHover(null)}
        onScroll={() => setExactHover(null)}
      >
        <div style={{ width: chartWidth, height: full ? "100%" : 290 + legendHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ left: 8, right: 4, top: 16, bottom: 0 }}
            barCategoryGap={selected ? "6%" : "10%"}
            barGap={0}
          >
            <CartesianGrid strokeDasharray="2 6" stroke="var(--chart-grid-line)" vertical={false} />
            <XAxis
              type="category"
              dataKey="name"
              interval={0}
              tickMargin={8}
              height={64}
              tick={renderNameTick}
              stroke="var(--chart-axis-line)"
              tickLine={false}
            />
            <YAxis
              type="number"
              width={68}
              tickFormatter={axisCompact}
              tick={{ fontSize: 10, fill: "var(--chart-axis-label)" }}
              stroke="var(--chart-axis-line)"
              tickLine={false}
            />
            {!selected ? (
              <Tooltip
                {...tooltipStyle}
                shared={false}
                cursor={{ fill: "var(--chart-hover-fill)" }}
                labelFormatter={(label) => `Main Group: ${label}`}
                formatter={(v: number, _series: string, item: { payload?: Record<string, unknown> }) => {
                  const count = Number(item.payload?.["count"] ?? 0);
                  return [`${INRC(v)} · ${count.toLocaleString("en-IN")} records`, "Amount"];
                }}
              />
            ) : null}
            {!selected ? (
              <Bar
                dataKey="value"
                name="Amount"
                radius={[3, 3, 0, 0]}
                maxBarSize={42}
                cursor="pointer"
                onClick={(entry: { name?: unknown }) => {
                  if (entry?.name) onSelect(String(entry.name));
                }}
              >
                {categories.map((category, index) => (
                  <Cell key={category.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
                <LabelList dataKey="total" position="top" content={renderBarLabel} />
              </Bar>
            ) : (
              divisions.map((division, index) => (
                <Bar
                  key={division}
                  dataKey={division}
                  name={division}
                  stackId="division"
                  fill={divisionColors.get(division) ?? "var(--chart-1)"}
                  shape={ExactHoverBarShape}
                  maxBarSize={42}
                  minPointSize={0}
                  isAnimationActive={false}
                  activeBar={{ stroke: "var(--ring)", strokeWidth: 1 }}
                  {...(index === divisions.length - 1 ? { radius: [3, 3, 0, 0] as [number, number, number, number] } : {})}
                >
                  {index === divisions.length - 1 ? (
                    <LabelList dataKey="total" position="top" content={renderBarLabel} />
                  ) : null}
                </Bar>
              ))
            )}
            {selected ? (
              <Legend
                verticalAlign="bottom"
                height={legendHeight}
                wrapperStyle={{ paddingTop: "16px" }}
                content={() => (
                  <div className="flex min-w-0 items-center gap-3 overflow-x-auto whitespace-nowrap px-2 pb-1 text-[11px] text-muted-foreground">
                    <span className="shrink-0 font-semibold text-foreground">PC Short Name</span>
                    <div className="flex shrink-0 items-center gap-4">
                      {divisions.map((division, index) => (
                        <span key={division} className="inline-flex shrink-0 items-center gap-1.5">
                          <span
                            className="size-2.5 shrink-0 rounded-sm"
                            style={{ background: divisionColors.get(division) ?? "var(--chart-1)" }}
                          />
                          {division}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              />
            ) : null}
          </BarChart>
        </ResponsiveContainer>
        </div>
        {exactHover && typeof document !== "undefined"
          ? createPortal(
              <div
                ref={exactTooltipRef}
                className="pointer-events-none fixed z-50 min-w-52 max-w-[min(20rem,calc(100vw-1rem))] whitespace-normal break-words rounded-md border border-border bg-card px-3 py-2 text-xs text-card-foreground shadow-lg"
                style={{
                  left: exactTooltipPosition?.left ?? 0,
                  top: exactTooltipPosition?.top ?? 0,
                  visibility: exactTooltipPosition ? "visible" : "hidden",
                }}
                role="tooltip"
              >
                <p className="font-semibold">Sub Group: {exactHover.subgroup}</p>
                <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                  <span
                    className="size-2.5 shrink-0 rounded-sm"
                    style={{ background: divisionColors.get(exactHover.division) ?? "var(--chart-1)" }}
                  />
                  PC Short Name: {exactHover.division}
                </p>
                <p className="text-muted-foreground">Amount: {INRC(exactHover.value)}</p>
                <p className="text-muted-foreground">Records: {exactHover.count.toLocaleString("en-IN")}</p>
              </div>,
              document.body,
            )
          : null}
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
      <div className="cxo-chart-surface relative h-[230px] w-full max-w-[240px] shrink-0">
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
            <p className="text-base font-semibold text-[var(--chart-label-strong)]">₹{compact(total)}</p>
            <p className="text-[11px] text-[var(--chart-axis-label)]">Total amount</p>
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
  { key: "mainGroup", label: "Main Group", render: (r) => r.mainGroup || "—" },
  { key: "subGroup", label: "Sub Group", render: (r) => r.subGroup || "—" },
  { key: "pcShortName", label: "PC Short Name (Division)", render: (r) => r.pcShortName || "—" },
  { key: "material", label: "Material", render: (r) => r.material || "—" },
  { key: "materialDesc", label: "Material description", render: (r) => r.materialDesc || "—" },
  { key: "model", label: "Model", render: (r) => r.model || "—" },
  { key: "productRange", label: "Range", render: (r) => r.productRange || "—" },
  { key: "productType", label: "Type", render: (r) => r.productType || "—" },
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
  const navigate = useNavigate();
  const fetchTargets = useServerFn(listSalesRevenueTargets);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<SdFilters>(emptySdFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfExportAllModels, setPdfExportAllModels] = useState(false);
  // Shared drill-down: selecting a main group in either the treemap or the
  // bar chart updates both cards.

  const [selectedMainGroup, setSelectedMainGroup] = useState<string | null>(null);
  const [salesTypeTab, setSalesTypeTab] = useState<(typeof SALES_TYPE_TABS)[number]>("All");
  const [focus, setFocus] = useState<"revenue" | "customers" | null>(null);
  const [trendMode, setTrendMode] = useState<TrendMode>("Monthly");
  const [modelLimit, setModelLimit] = useState<ModelLimit>(10);
  const [targetDialogOpen, setTargetDialogOpen] = useState(false);

  const { data: launchpad } = useLaunchpad();
  const { data: revenueTargets = [] } = useQuery({
    queryKey: ["sales-revenue-targets"],
    queryFn: () => fetchTargets(),
  });

  const { data: lines, isLoading } = useQuery({
    queryKey: ["sd-live-lines"],
    queryFn: fetchSdLines,
  });

  const all = useMemo(() => lines ?? [], [lines]);
  useEffect(() => {
    const shared = readSharedSalesFilters();
    setFilters((prev) => ({ ...prev, ...shared }));
    return subscribeSharedSalesFilters((next) => setFilters((prev) => ({ ...prev, ...next })));
  }, []);
  const typeFiltered = useMemo(() => {
    if (salesTypeTab === "All") return all;
    const target = salesTypeTab === "Services" ? "service" : salesTypeTab.toLowerCase();
    return all.filter((r) => (r.salesType || "").trim().toLowerCase() === target);
  }, [all, salesTypeTab]);
  const filtered = useMemo(() => applySdFilters(typeFiltered, filters), [typeFiltered, filters]);
  const analytics = useMemo(() => buildSdAnalytics(filtered), [filtered]);
  const quarterComparisonRows = useMemo(
    () => applySdFilters(typeFiltered, { ...filters, from: "", to: "", fiscalYears: [], quarters: [] }),
    [typeFiltered, filters],
  );
  const quarterSummaries = useMemo(
    () => buildQuarterSummaries(filtered, quarterComparisonRows, filters.fiscalYears, filters.quarters, { from: filters.from, to: filters.to }),
    [filtered, quarterComparisonRows, filters.fiscalYears, filters.quarters, filters.from, filters.to],
  );

  const opts = useMemo(
    () => ({
      plants: uniqueValues(all, (r) => r.plant).filter((p) => !PLANT_OPTIONS_EXCLUDED.includes(p)),
      profitCentres: uniqueValues(all, (r) => r.pcShortName),
      segments: uniqueValues(all, (r) => r.businessSegment || r.segment),
      customers: uniqueValues(all, (r) => r.customerName || r.customer),
      fiscalYears: uniqueValues(all, (r) => fiscalYearForDate(r.postingDate)).sort((a, b) => b.localeCompare(a)),
    }),
    [all],
  );

  const set = (patch: Partial<SdFilters>) => setFilters((prev) => {
    const next = { ...prev, ...patch };
    if ("segments" in patch || "customers" in patch || "profitCentres" in patch || "from" in patch || "to" in patch) {
      writeSharedSalesFilters({
        segments: next.segments,
        customers: next.customers,
        profitCentres: next.profitCentres,
        from: next.from,
        to: next.to,
      });
    }
    return next;
  });
  const toOptions = (values: string[]) => values.map((v) => ({ value: v, label: v }));

  const activeChips: { label: string; clear: () => void }[] = [];
  if (filters.from || filters.to)
    activeChips.push({
      label: `Posting ${filters.from || "…"} → ${filters.to || "…"}`,
      clear: () => set({ from: "", to: "" }),
    });
  if (filters.fiscalYears.length)
    activeChips.push({
      label: `Year: ${filters.fiscalYears.length === 1 ? filters.fiscalYears[0] : `${filters.fiscalYears.length} selected`}`,
      clear: () => set({ fiscalYears: [], quarters: [] }),
    });
  if (filters.quarters.length)
    activeChips.push({
      label: `Quarter: ${filters.quarters.length === 1 ? filters.quarters[0] : `${filters.quarters.length} selected`}`,
      clear: () => set({ quarters: [] }),
    });
  const listChips: [keyof SdFilters, string][] = [
    ["plants", "Plant"],
    ["profitCentres", "Profit centre"],
    ["segments", "Segment"],
    ["customers", "Customer"],
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

  const downloadDashboardPdf = async () => {
    setPdfBusy(true);
    setPdfExportAllModels(true);
    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      await exportDashboardPdf(dashboardRef.current, "sales-dashboard.pdf");
      toast.success("Dashboard PDF downloaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to download the dashboard PDF");
    } finally {
      setPdfExportAllModels(false);
      setPdfBusy(false);
    }
  };

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
      <div className="grid gap-4">
        <Skeleton className="h-28" />
      </div>
    );
  }

  const totalRevenue = analytics.kpis.revenue;
  const selectedFiscalYear = filters.fiscalYears.length === 1
    ? filters.fiscalYears[0] ?? ""
    : quarterSummaries[0]?.fiscalYear ?? "";
  const revenueTarget = revenueTargets.find((target) => target.fiscalYear === selectedFiscalYear)?.targetAmount ?? null;
  const salesBreakdown = buildSalesBreakdown(analytics.mixByType);
  const latestQuarterWithSales = [...quarterSummaries].reverse().find((summary) => summary.recordCount > 0)?.quarter ?? null;

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
  const openDrilldown = (selection: { month?: string; customer?: string }) => {
    const monthIndex = selection.month ? MONTHS.indexOf(selection.month.toUpperCase().slice(0, 3)) : -1;
    const month = monthIndex >= 0 && trend.cy ? `${trend.cy}-${String(monthIndex + 1).padStart(2, "0")}` : "";
    navigate({
      to: "/reports/sd/drilldown",
      search: {
        month,
        customer: selection.customer ?? "",
        from: filters.from,
        to: filters.to,
        fiscalYears: filters.fiscalYears,
        quarters: filters.quarters,
        salesType: salesTypeTab === "All" ? "" : salesTypeTab === "Services" ? "Service" : salesTypeTab,
        segments: filters.segments,
        profitCentres: filters.profitCentres,
        plants: filters.plants,
        kpi: "",
        src: "",
        q: "",
        page: 1,
      },
    });
  };

  return (
    <div ref={dashboardRef} className="space-y-4">
      {/* executive header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Sales Dashboard</h2>
          <p className="text-sm text-muted-foreground">Executive Overview</p>
        </div>
        <div className="flex max-w-full flex-wrap items-center gap-2">
          <span className="hidden h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-card-foreground shadow-tile sm:inline-flex">
            <CalendarDays className="size-4 text-muted-foreground" />
            {periodLabel(analytics.monthly, filters.from, filters.to)}
          </span>
          <Button variant="outline" size="sm" className="h-9" onClick={() => setShowFilters((v) => !v)}>
            <Filter className="mr-1 size-4" /> Filters
          </Button>
          {launchpad?.isSuperAdmin ? (
            <Button variant="outline" size="sm" className="h-9" onClick={() => setTargetDialogOpen(true)}>
              <Target className="size-4 sm:mr-1" /> <span className="hidden sm:inline">Revenue Targets</span>
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            disabled={pdfBusy || !all.length}
            onClick={downloadDashboardPdf}
          >
            <Download className="size-4 sm:mr-1" /> <span className="hidden sm:inline">{pdfBusy ? "Preparing…" : "PDF"}</span>
          </Button>
        </div>
      </div>

      {launchpad?.isSuperAdmin ? (
        <RevenueTargetDialog
          open={targetDialogOpen}
          onOpenChange={setTargetDialogOpen}
          fiscalYears={opts.fiscalYears}
          targets={revenueTargets}
        />
      ) : null}

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
              onClick={() => {
                setFilters(emptySdFilters);
                writeSharedSalesFilters({ segments: [], customers: [], profitCentres: [], from: "", to: "" });
              }}
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
                Year
                <div className="mt-1">
                  <MultiSelect
                    options={toOptions(opts.fiscalYears)}
                    selected={filters.fiscalYears}
                    onChange={(fiscalYears) => set({ fiscalYears, quarters: fiscalYears.length ? filters.quarters : [] })}
                    placeholder="All years"
                    emptyText="No years available"
                  />
                </div>
              </label>
              <label className="min-w-0 text-xs font-medium text-muted-foreground">
                Quarter
                <div className="mt-1">
                  <MultiSelect
                    options={FISCAL_QUARTERS.map((quarter) => ({
                      value: quarter,
                      label: `${quarter} · ${quarter === "Q1" ? "Apr–Jun" : quarter === "Q2" ? "Jul–Sep" : quarter === "Q3" ? "Oct–Dec" : "Jan–Mar"}`,
                    }))}
                    selected={filters.quarters}
                    onChange={(quarters) => set({ quarters })}
                    placeholder="All quarters"
                    disabled={!filters.fiscalYears.length}
                  />
                </div>
              </label>
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
              <label className="min-w-0 text-xs font-medium text-muted-foreground lg:col-span-2">
                Segment
                <div className="mt-1">
                  <MultiSelect
                    options={toOptions(opts.segments)}
                    selected={filters.segments}
                    onChange={(next) => set({ segments: next })}
                  />
                </div>
              </label>
              <label className="min-w-0 text-xs font-medium text-muted-foreground lg:col-span-2">
                Customer
                <div className="mt-1">
                  <MultiSelect
                    options={toOptions(opts.customers)}
                    selected={filters.customers}
                    onChange={(next) => set({ customers: next })}
                  />
                </div>
              </label>
            </div>

            <p className="text-xs text-muted-foreground">
              Showing {NUM(filtered.length)} of {NUM(all.length)} posting lines
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

      <div className="flex flex-wrap items-center justify-end gap-3">
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
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-4">
            <TotalSalesCard
              amount={totalRevenue}
              postingCount={filtered.length}
              fiscalYear={selectedFiscalYear}
              breakdown={salesBreakdown}
              target={revenueTarget}
              onClick={() => setFocus(focus === "revenue" ? null : "revenue")}
              active={focus === "revenue"}
            />
            </div>
            <div
              className={`grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-8 ${
                quarterSummaries.length === 1
                  ? "lg:grid-cols-1"
                  : quarterSummaries.length === 2
                    ? "lg:grid-cols-2"
                    : quarterSummaries.length === 3
                      ? "lg:grid-cols-3"
                      : "lg:grid-cols-4"
              }`}
            >
              {quarterSummaries.map((summary, index) => (
                <QuarterCard key={summary.quarter} summary={summary} tone={index + 1} active={summary.quarter === latestQuarterWithSales} />
              ))}
            </div>
          </div>

          <QuarterAnalysis summaries={quarterSummaries} onDownload={downloadDashboardPdf} busy={pdfBusy} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-4">
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

            <div className="min-w-0 lg:col-span-8">
            <Panel title="Main Group in CR" accent={3} expandable>
              {(full: boolean) => (
                <MainGroupBars
                  items={analytics.byMainGroup}
                  subGroups={analytics.subGroupsByMainGroup}
                  divisionsByMainGroup={analytics.divisionsByMainGroup}
                  divisionsBySubGroup={analytics.divisionsBySubGroup}
                  full={full}
                  selected={selectedMainGroup}
                  onSelect={setSelectedMainGroup}
                />
              )}
            </Panel>
            </div>
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
          {/* Row 2 — customers, sales trend, top profit centres */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Top 10 Customers by Amount" accent={2} expandable>
              {(full: boolean) => <BarList items={analytics.topCustomers} tone={1} full={full} onSelect={(customer) => openDrilldown({ customer })} />}
            </Panel>

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
                  <div className={`cxo-chart-surface ${full ? "min-h-0 flex-1" : ""}`}>
                    <ResponsiveContainer width="100%" height={full ? "100%" : 290}>
                      <ComposedChart data={trend.rows} margin={{ top: 18, left: 0, right: 8, bottom: 2 }} onClick={(state) => { if (trendMode === "Monthly" && state?.activeLabel) openDrilldown({ month: String(state.activeLabel) }); }} className={trendMode === "Monthly" ? "cursor-pointer" : ""}>
                        <CartesianGrid strokeDasharray="2 6" stroke="var(--chart-grid-line)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--chart-axis-label)" }} stroke="var(--chart-axis-line)" tickLine={false} tickMargin={8} />
                        <YAxis
                          tickFormatter={axisCompact}
                          tick={{ fontSize: 10, fill: "var(--chart-axis-label)" }}
                          width={60}
                          stroke="var(--chart-axis-line)"
                          tickLine={false}
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

            <Panel title="Top 10 Profit Centres" accent={4} expandable>
              {(full: boolean) => <BarList items={analytics.topProfitCentres} tone={0} full={full} valueFormatter={CRORES_VALUE} />}
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Segment" accent={2} expandable>
              <SegmentDonut items={analytics.bySegment} total={totalRevenue} />
            </Panel>

            <Panel title="Customer Contribution (Top Sales up to 10)" accent={1} expandable>
              {(full: boolean) => (
                <div className={`cxo-chart-surface ${full ? "h-full" : ""}`}>
                <ResponsiveContainer width="100%" height={full ? "100%" : 300}>
                  <ComposedChart data={analytics.pareto} margin={{ top: 24, left: 4, right: 8, bottom: 42 }}>
                    <CartesianGrid strokeDasharray="2 6" stroke="var(--chart-grid-line)" vertical={false} />
                    <XAxis
                      dataKey="customer"
                      height={64}
                      interval={0}
                      angle={-28}
                      textAnchor="end"
                      tick={{ fontSize: 9, fill: "var(--chart-axis-label)" }}
                      tickFormatter={(value: string) => value.length > 15 ? `${value.slice(0, 14)}…` : value}
                      stroke="var(--chart-axis-line)"
                      tickLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      yAxisId="left"
                      width={58}
                      tick={{ fontSize: 10, fill: "var(--chart-axis-label)" }}
                      tickFormatter={(v: number) => axisCompact(v)}
                      stroke="var(--chart-axis-line)"
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      width={44}
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: "var(--chart-emphasis)" }}
                      tickFormatter={(v: number) => `${Math.round(v)}%`}
                      stroke="var(--chart-axis-line)"
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--chart-hover-fill)" }}
                      content={({ active, payload }) => {
                        const point = payload?.[0]?.payload as
                          | { customer: string; value: number; contributionPct: number; cumulativePct: number }
                          | undefined;
                        if (!active || !point) return null;
                        return (
                          <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
                            <p className="mb-1 max-w-56 font-semibold">{point.customer}</p>
                            <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-1">
                              <span className="text-muted-foreground">Sales amount</span>
                              <span className="text-right font-medium tabular-nums">{INRC(point.value)}</span>
                              <span className="text-muted-foreground">Contribution</span>
                              <span className="text-right font-medium tabular-nums">{point.contributionPct.toFixed(1)}%</span>
                              <span className="text-muted-foreground">Cumulative</span>
                              <span className="text-right font-medium tabular-nums">{point.cumulativePct.toFixed(1)}%</span>
                            </div>
                          </div>
                        );
                      }}
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
                        style={{ fontSize: 10, fill: "var(--chart-label-strong)" }}
                        formatter={(v: number) => compact(v)}
                      />
                    </Bar>
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="cumulativePct"
                      name="Cumulative %"
                      stroke="var(--chart-emphasis)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    >
                      <LabelList
                        dataKey="cumulativePct"
                        position="top"
                        style={{ fontSize: 10, fill: "var(--chart-emphasis)", fontWeight: 600 }}
                        formatter={(v: number) => `${v.toFixed(0)}%`}
                      />
                    </Line>
                  </ComposedChart>
                </ResponsiveContainer>
                </div>
              )}
            </Panel>

            <Panel title="Sales Mix" accent={2} expandable>
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
                        <span className="tabular">{CRORES_VALUE(m.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Sales by New_Repl" accent={3} expandable>
              <BsarkBars items={analytics.byNewRepl} unassigned={analytics.unassignedNewReplCount} />
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
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Top 10 Materials" accent={3} expandable>
              {(full: boolean) => <BarList items={analytics.topMaterials} tone={2} full={full} valueFormatter={CRORES_VALUE} />}
            </Panel>

            <Panel title="Top 10 Sales Men" accent={2} expandable>
              {(full: boolean) => <BarList items={analytics.topSalesEmployees} tone={1} full={full} valueFormatter={CRORES_VALUE} />}
            </Panel>

          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <KpiCard
              label="Total LAH (Lakhs)"
              value={LAKHS_VALUE(analytics.kpis.positiveAhTotal)}
              tone={4}
              icon={Building2}
              caption="Total AH > 0"
            />
            <KpiCard
              label="AH Sales"
              value={CRORES(analytics.kpis.positiveAhSales)}
              tone={1}
              icon={IndianRupee}
              caption="Local currency amount where Total AH > 0"
            />
          </div>

          <Panel
            title="Sales by Model (Amount & Per AH)"
            expandable
            actions={
              <div className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 p-0.5">
                {([10, 20, "all"] as const).map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant={(pdfExportAllModels ? "all" : modelLimit) === value ? "default" : "ghost"}
                    size="sm"
                    className="h-7 px-2 text-[11px]"
                    onClick={() => setModelLimit(value)}
                  >
                    {value === "all" ? "All Models" : `Top ${value} Models`}
                  </Button>
                ))}
              </div>
            }
          >
            {(full: boolean) => (
              <SalesByModelChart
                items={analytics.modelPerformance}
                limit={pdfExportAllModels ? "all" : modelLimit}
                full={full || pdfExportAllModels}
              />
            )}
          </Panel>

          <div data-pdf-exclude>
            <LinesTable
              rows={filtered}
              onExport={exportRows}
              pcColors={pcColors.map}
              pcLegend={pcLegend}
            />
          </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
