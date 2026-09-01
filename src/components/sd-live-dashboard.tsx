import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
  FileText,
  Users,
  Gauge,
  Package,
  Building2,
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
  if (abs >= 1e7) return `${(value / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `${(value / 1e5).toFixed(2)} L`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)} K`;
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
}: {
  data: { name: string; value: number }[];
  valueLabel: string;
  tone?: number;
}) {
  if (!data.length) return <p className="py-10 text-center text-sm text-muted-foreground">No data</p>;
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="2 6" stroke="var(--color-border)" horizontal={false} />
        <XAxis type="number" tickFormatter={compact} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
        <YAxis
          type="category"
          dataKey="name"
          width={150}
          tick={{ fontSize: 11 }}
          stroke="var(--color-muted-foreground)"
        />
        <Tooltip {...tooltipStyle} formatter={(v: number) => [INR(v), valueLabel]} />
        <Bar dataKey="value" radius={[3, 3, 3, 3]} fill={KPI_TONES[tone % KPI_TONES.length]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function Donut({ data }: { data: { name: string; value: number }[] }) {
  if (!data.length) return <p className="py-10 text-center text-sm text-muted-foreground">No data</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip {...tooltipStyle} formatter={(v: number, n: string) => [INR(v), n]} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* --------------------------------- table ---------------------------------- */

type Column = { key: string; label: string; numeric?: boolean; render: (r: SdLine) => string };

const COLUMNS: Column[] = [
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

function LinesTable({ rows, onExport }: { rows: SdLine[]; onExport: () => void }) {
  const [hidden, setHidden] = useState<string[]>([]);
  const [page, setPage] = useState(0);

  const visible = COLUMNS.filter((c) => !hidden.includes(c.key));
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const slice = rows.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  return (
    <Panel
      title={`Document lines (${NUM(rows.length)})`}
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
            {slice.map((r, i) => (
              <tr
                key={`${r.docNo}-${r.docItem}-${r.material}-${i}`}
                className="border-t border-border/60 odd:bg-card even:bg-muted/40 hover:bg-accent/40"
              >
                {visible.map((c) => (
                  <td
                    key={c.key}
                    className={`px-2.5 py-1.5 whitespace-nowrap ${
                      c.numeric ? "tabular text-right" : ""
                    } ${c.key === "amount" && r.amount < 0 ? "text-destructive" : ""}`}
                  >
                    {c.render(r)}
                  </td>
                ))}
              </tr>
            ))}
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <KpiCard
              label="Total revenue"
              value={INR(totalRevenue)}
              tone={0}
              icon={IndianRupee}
              caption="Filtered postings"
            >
              <ShareBars items={analytics.mixByType} total={totalRevenue} />
            </KpiCard>
            <KpiCard
              label="Documents"
              value={NUM(analytics.kpis.documents)}
              tone={1}
              icon={FileText}
              caption={`${NUM(analytics.kpis.lines)} lines · ${analytics.kpis.linesPerDoc.toFixed(1)} per document`}
            />
            <KpiCard
              label="Customers"
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
              label="Avg realization / unit"
              value={analytics.kpis.avgRealization ? INR(analytics.kpis.avgRealization) : "—"}
              tone={4}
              icon={Package}
              caption={`${NUM(analytics.kpis.quantity)} units billed`}
            />
            <KpiCard
              label="Month-on-month"
              value={
                analytics.kpis.momPct == null
                  ? "—"
                  : `${analytics.kpis.momPct >= 0 ? "+" : ""}${analytics.kpis.momPct.toFixed(1)}%`
              }
              tone={analytics.kpis.momPct != null && analytics.kpis.momPct < 0 ? 5 : 1}
              icon={analytics.kpis.momPct != null && analytics.kpis.momPct < 0 ? TrendingDown : TrendingUp}
              caption={analytics.kpis.momLabel}
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
            <Panel title="Revenue trend" className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={analytics.monthly}>
                  <defs>
                    <linearGradient id="sdFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--kpi-1)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--kpi-1)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 6" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                  <YAxis tickFormatter={compact} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
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
                  <Area type="monotone" dataKey="revenue" stroke="var(--kpi-1)" fill="url(#sdFill)" strokeWidth={2} />
                  <Line
                    yAxisId="docs"
                    type="monotone"
                    dataKey="documents"
                    stroke="var(--kpi-3)"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Panel>

            <Panel title="Sales mix by type">
              <Donut data={analytics.mixByType} />
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
            </Panel>

            <Panel title="Volume & average realization by month" className="lg:col-span-2">
              {analytics.monthly.length ? (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={analytics.monthly}>
                    <CartesianGrid strokeDasharray="2 6" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                    <YAxis tickFormatter={compact} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                    <YAxis
                      yAxisId="rate"
                      orientation="right"
                      tickFormatter={compact}
                      tick={{ fontSize: 11 }}
                      stroke="var(--color-muted-foreground)"
                    />
                    <Tooltip
                      {...tooltipStyle}
                      formatter={(v: number, n: string) => [n === "quantity" ? NUM(v) : INR(v), n]}
                    />
                    <Bar dataKey="quantity" fill="var(--kpi-5)" radius={[4, 4, 0, 0]} barSize={26} />
                    <Line
                      yAxisId="rate"
                      type="monotone"
                      dataKey="realization"
                      stroke="var(--kpi-4)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">No data</p>
              )}
            </Panel>

            <Panel title="Top 5 materials">
              <RankedList items={analytics.topMaterials} total={totalRevenue} />
            </Panel>

            <Panel title="Top customers" className="lg:col-span-2">
              <HBar data={analytics.topCustomers} valueLabel="Revenue" tone={3} />
            </Panel>

            <Panel title="Revenue mix by type">
              <StackedMix items={analytics.mixByType} total={totalRevenue} />
            </Panel>
          </div>


          <LinesTable rows={filtered} onExport={exportRows} />
        </>
      )}
    </div>
  );
}
