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
  tone = 0,
  icon: Icon,
  children,
}: {
  label: string;
  value: string;
  caption?: string;
  tone?: number;
  icon: React.ComponentType<{ className?: string }>;
  children?: React.ReactNode;
}) {
  const color = KPI_TONES[tone % KPI_TONES.length];
  return (
    <section
      className="relative overflow-hidden rounded-lg border p-4 shadow-tile transition-shadow hover:shadow-lg"
      style={{
        borderColor: `color-mix(in oklab, ${color} 28%, var(--color-border))`,
        background: `linear-gradient(160deg, color-mix(in oklab, ${color} var(--kpi-tint), var(--color-card)) 0%, var(--color-card) 70%)`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
          <p className="tabular mt-2 text-2xl font-semibold" style={{ color }}>
            {value}
          </p>
        </div>
        <span
          className="grid size-9 shrink-0 place-items-center rounded-md"
          style={{ background: `color-mix(in oklab, ${color} 20%, transparent)`, color }}
        >
          <Icon className="size-4" />
        </span>
      </div>
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
          tickFormatter={(v: string) => (v && v.length > 36 ? `${v.slice(0, 34)}…` : v || "—")}
          tick={{ fontSize: 11 }}
          stroke="var(--color-muted-foreground)"
        />
        <Tooltip {...tooltipStyle} formatter={(v: number) => [INR(v), valueLabel]} />
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
                <span className="truncate text-sm">{item.name || "—"}</span>
              </span>
              <Badge variant="secondary" className="tabular shrink-0">
                {share.toFixed(1)}%
              </Badge>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-muted">
              <div
                className="h-1.5 rounded-full"
                style={{ width: `${Math.max(2, Math.min(100, share))}%`, background: color }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
              <span>{item.count} line(s)</span>
              <span className="tabular">{INR(item.value)}</span>
            </div>
          </li>
        );
      })}
    </ol>
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
            `${INR(v)} · ${total ? ((v / total) * 100).toFixed(1) : "0"}%`,
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

function SegmentDonut({ items, total }: { items: { name: string; value: number }[]; total: number }) {
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
                `${INR(v)} · ${((v / total) * 100).toFixed(1)}%`,
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
      <div className="w-full flex-1 space-y-2">
        {items.map((item, i) => (
          <div key={item.name} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-sm"
                style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              <span className="truncate" title={item.name || "—"}>
                {item.name || "—"}
              </span>
            </span>
            <span className="tabular shrink-0 whitespace-nowrap text-muted-foreground">
              ₹{compact(item.value)} · {((item.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
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
  { key: "amount", label: "Amount", numeric: true, render: (r) => INR(r.amount) },
  { key: "segment", label: "Segment", render: (r) => r.segment || "—" },
  { key: "salesRepName", label: "Sales employee", render: (r) => r.salesRepName || "—" },
  { key: "incoterms", label: "Incoterms", render: (r) => r.incoterms || "—" },
  { key: "usageDesc", label: "Usage", render: (r) => r.usageDesc || "—" },
];

const PAGE_SIZE = 50;

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
      title={`ZFISALES_MIS List (${NUM(rows.length)})`}
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
  const [showFilters, setShowFilters] = useState(true);

  const { data: lines, isLoading } = useQuery({
    queryKey: ["sd-live-lines"],
    queryFn: fetchSdLines,
  });

  const { data: sync } = useQuery({ queryKey: ["sd-sync-status"], queryFn: getSalesSyncStatus });

  const all = useMemo(() => lines ?? [], [lines]);
  const filtered = useMemo(() => applySdFilters(all, filters), [all, filters]);
  const analytics = useMemo(() => buildSdAnalytics(filtered), [filtered]);

  const opts = useMemo(
    () => ({
      plants: uniqueValues(all, (r) => r.plant),
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
        for (const c of COLUMNS) out[c.label] = c.numeric ? Number(c.render(r).replace(/[^\d.-]/g, "")) : c.render(r);
        return out;
      }),
      "sd-sales-lines.csv",
    );

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

  return (
    <div className="space-y-4">
      {/* smart filter bar */}
      <section className="rounded-lg border border-border bg-card shadow-tile">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="inline-flex items-center gap-2 text-sm font-medium text-card-foreground"
          >
            <Filter className="size-4 text-primary" />
            Smart filters
            <Badge variant="secondary" className="ml-1">
              {activeChips.length}
            </Badge>
          </button>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-2.5 left-2 size-4 text-muted-foreground" />
              <Input
                value={filters.search}
                onChange={(e) => set({ search: e.target.value })}
                placeholder="Search document, customer, material"
                className="h-9 w-64 pl-8"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => setFilters(emptySdFilters)}>
              <RotateCcw className="mr-1 size-3.5" /> Reset
            </Button>
          </div>
        </div>

        {showFilters ? (
          <div className="grid gap-3 border-t border-border px-4 py-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs text-muted-foreground">
              Posting from
              <Input
                type="date"
                value={filters.from}
                onChange={(e) => set({ from: e.target.value })}
                className="mt-1 h-9"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Posting to
              <Input
                type="date"
                value={filters.to}
                onChange={(e) => set({ to: e.target.value })}
                className="mt-1 h-9"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Plant
              <div className="mt-1">
                <MultiSelect
                  options={toOptions(opts.plants)}
                  selected={filters.plants}
                  onChange={(next) => set({ plants: next })}
                />
              </div>
            </label>
            <label className="text-xs text-muted-foreground">
              Profit centre
              <div className="mt-1">
                <MultiSelect
                  options={toOptions(opts.profitCentres)}
                  selected={filters.profitCentres}
                  onChange={(next) => set({ profitCentres: next })}
                />
              </div>
            </label>
            <div className="col-span-full flex flex-wrap gap-2">
              {[
                { label: "Last 7 days", from: isoDaysAgo(7) },
                { label: "Last 30 days", from: isoDaysAgo(30) },
                { label: "Last 90 days", from: isoDaysAgo(90) },
              ].map((preset) => (
                <Button
                  key={preset.label}
                  variant="secondary"
                  size="sm"
                  onClick={() => set({ from: preset.from, to: isoDaysAgo(0) })}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
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

      <p className="text-xs text-muted-foreground">
        Source: ZFISALES_DETAIL · {NUM(all.length)} synced lines · last synced{" "}
        {formatDateTimeISTLabel(sync?.lastSyncedAt)}
        {sync?.lastStatus && sync.lastStatus !== "success" ? (
          <span className="text-destructive"> · last run {sync.lastStatus}</span>
        ) : null}
      </p>

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard
              label="Total Sales"
              value={INR(totalRevenue)}
              tone={0}
              icon={IndianRupee}
              caption="Filtered postings"
            >
              <ShareBars items={analytics.mixByType} total={totalRevenue} />
            </KpiCard>
            <KpiCard
              label="Total quantity"
              value={NUM(analytics.kpis.quantity)}
              tone={4}
              icon={Boxes}
              caption={`Units billed${topUnit ? ` (${topUnit})` : ""}`}
            />
            <KpiCard
              label="Active Customers"
              value={NUM(analytics.kpis.customers)}
              tone={2}
              icon={Users}
              caption="Billed in selection"
            />
            <KpiCard
              label="Avg order value"
              value={INR(analytics.kpis.avgDoc)}
              tone={3}
              icon={Gauge}
              caption="Revenue per document"
            />
            <KpiCard
              label="Top profit centre"
              value={compact(analytics.kpis.topProfitCentreValue)}
              tone={5}
              icon={Building2}
              caption={analytics.kpis.topProfitCentre}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Revenue trend" accent={1} className="lg:col-span-2" expandable>
              {(full: boolean) => (
              <div
                className={`rounded-md p-2 ${full ? "h-full" : ""}`}
                style={{ background: "color-mix(in oklab, var(--kpi-1) 6%, transparent)" }}
              >
              <ResponsiveContainer width="100%" height={full ? "100%" : 300}>

                <ComposedChart data={analytics.monthly} margin={{ top: 26, left: 0, right: 0 }}>
                  <defs>
                    <linearGradient id="sdFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--kpi-1)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--kpi-1)" stopOpacity={0.06} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 6" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                  <YAxis
                    tickFormatter={compact}
                    tick={{ fontSize: 11 }}
                    width={58}
                    tickMargin={2}
                    stroke="var(--color-muted-foreground)"
                  />
                  <YAxis
                    yAxisId="docs"
                    orientation="right"
                    tick={{ fontSize: 11 }}
                    stroke="var(--color-muted-foreground)"
                  />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(v: number, n: string) => [n === "documents" ? NUM(v) : INR(v), n]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="var(--kpi-1)" fill="url(#sdFill)" strokeWidth={2}>
                    <LabelList
                      dataKey="revenue"
                      position="top"
                      offset={8}
                      formatter={(v: number, _n?: unknown, idx?: number) =>
                        labelEvery(analytics.monthly.length, idx) ? compact(v) : ""
                      }
                      fontSize={10}
                      fontWeight={600}
                      fill="var(--kpi-1)"
                      stroke="var(--color-card)"
                      strokeWidth={3}
                      paintOrder="stroke"
                    />
                  </Area>
                  <Line
                    yAxisId="docs"
                    type="monotone"
                    dataKey="documents"
                    stroke="var(--kpi-3)"
                    strokeWidth={2}
                    dot={false}
                  >
                    <LabelList
                      dataKey="documents"
                      position="bottom"
                      offset={8}
                      formatter={(v: number, _n?: unknown, idx?: number) =>
                        labelEvery(analytics.monthly.length, idx) ? NUM(v) : ""
                      }
                      fontSize={10}
                      fontWeight={600}
                      fill="var(--kpi-3)"
                      stroke="var(--color-card)"
                      strokeWidth={3}
                      paintOrder="stroke"
                    />
                  </Line>

                </ComposedChart>
              </ResponsiveContainer>
              </div>
              )}
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
                        <span className="tabular">{INR(m.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Panel>



            <Panel title="Top 5 materials" accent={3}>
              <RankedList items={analytics.topMaterials} total={totalRevenue} />
            </Panel>

            <Panel title="Top customers" accent={4} className="lg:col-span-2" expandable>
              {(full: boolean) => (
                <div className={full ? "h-full" : ""}>
                  <HBar
                    data={analytics.topCustomers}
                    valueLabel="Revenue"
                    tone={3}
                    {...(full ? { height: "100%" as const } : {})}
                  />
                </div>
              )}
            </Panel>


            <Panel title="Sales by Segment (Amount)" accent={2}>
              <SegmentDonut items={analytics.bySegment} total={totalRevenue} />
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
    </div>
  );
}
