import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
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
import { Filter, RotateCcw, Search, Download } from "lucide-react";
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

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
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
  tone = 0,
  children,
}: {
  label: string;
  value: string;
  caption?: string;
  tone?: number;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-md border border-border bg-card p-4 shadow-tile">
      <span
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: CHART_COLORS[tone % CHART_COLORS.length] }}
      />
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="tabular mt-2 text-2xl font-light text-foreground">{value}</p>
      {caption ? <p className="mt-1 text-xs text-muted-foreground">{caption}</p> : null}
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
                width: `${Math.max(2, (item.value / total) * 100)}%`,
                background: CHART_COLORS[i % CHART_COLORS.length],
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

function HBar({ data, valueLabel }: { data: { name: string; value: number }[]; valueLabel: string }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
        <XAxis type="number" tickFormatter={compact} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
        <YAxis
          type="category"
          dataKey="name"
          width={150}
          tick={{ fontSize: 11 }}
          stroke="var(--color-muted-foreground)"
        />
        <Tooltip {...tooltipStyle} formatter={(v: number) => [INR(v), valueLabel]} />
        <Bar dataKey="value" radius={[0, 3, 3, 0]} fill="var(--color-chart-1)" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function Donut({ data }: { data: { name: string; value: number }[] }) {
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
      fiscalYears: uniqueValues(all, (r) => r.fiscalYear),
      plants: uniqueValues(all, (r) => r.plant),
      profitCentres: uniqueValues(all, (r) => r.profitCtr),
      salesTypes: uniqueValues(all, (r) => r.salesType),
      segments: uniqueValues(all, (r) => r.segment),
      productGroups: uniqueValues(all, (r) => r.productGroup),
      countries: uniqueValues(all, (r) => r.countryName),
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
    ["fiscalYears", "FY"],
    ["plants", "Plant"],
    ["profitCentres", "Profit centre"],
    ["salesTypes", "Sales type"],
    ["segments", "Segment"],
    ["productGroups", "Product group"],
    ["countries", "Country"],
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
      filtered.map((r) => ({
        Document: r.docNo,
        "Posting date": r.postingDate,
        Month: r.month,
        Plant: r.plant,
        "Profit centre": r.profitCtrName || r.profitCtr,
        Customer: r.customerName || r.customer,
        "Sales type": r.salesType,
        Segment: r.segment,
        Material: r.material,
        Description: r.materialDesc,
        Country: r.countryName,
        Quantity: r.quantity,
        Unit: r.unit,
        Amount: r.amount,
      })),
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
      <section className="rounded-md border border-border bg-card shadow-tile">
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
          <div className="grid gap-3 border-t border-border px-4 py-4 md:grid-cols-3 lg:grid-cols-4">
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
            <div className="col-span-full flex flex-wrap gap-2 md:col-span-1 lg:col-span-2">
              {[
                { label: "Last 7 days", from: isoDaysAgo(7) },
                { label: "Last 30 days", from: isoDaysAgo(30) },
                { label: "Last 90 days", from: isoDaysAgo(90) },
              ].map((preset) => (
                <Button
                  key={preset.label}
                  variant="secondary"
                  size="sm"
                  className="self-end"
                  onClick={() => set({ from: preset.from, to: isoDaysAgo(0) })}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {(
              [
                ["fiscalYears", "Fiscal year", opts.fiscalYears],
                ["plants", "Plant", opts.plants],
                ["profitCentres", "Profit centre", opts.profitCentres],
                ["salesTypes", "Sales type", opts.salesTypes],
                ["segments", "Segment", opts.segments],
                ["productGroups", "Product group", opts.productGroups],
                ["countries", "Country", opts.countries],
              ] as [keyof SdFilters, string, string[]][]
            ).map(([key, label, values]) => (
              <label key={String(key)} className="text-xs text-muted-foreground">
                {label}
                <div className="mt-1">
                  <MultiSelect
                    options={toOptions(values)}
                    selected={filters[key] as string[]}
                    onChange={(next) => set({ [key]: next } as Partial<SdFilters>)}
                  />
                </div>
              </label>
            ))}
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard label="Total revenue" value={INR(totalRevenue)} tone={0} caption="Filtered postings">
              <ShareBars items={analytics.mixByType} total={totalRevenue} />
            </KpiCard>
            <KpiCard label="Documents" value={NUM(analytics.kpis.documents)} tone={1} caption="Unique FI documents" />
            <KpiCard label="Customers" value={NUM(analytics.kpis.customers)} tone={2} caption="Billed in selection" />
            <KpiCard label="Avg / document" value={INR(analytics.kpis.avgDoc)} tone={3} caption="Revenue per document" />
            <KpiCard label="Quantity" value={NUM(analytics.kpis.quantity)} tone={4} caption="Billed quantity" />
            <KpiCard
              label="Top profit centre"
              value={analytics.byProfitCentre[0] ? compact(analytics.byProfitCentre[0].value) : "—"}
              tone={1}
              caption={analytics.kpis.topProfitCentre}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Revenue trend" className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={analytics.monthly}>
                  <defs>
                    <linearGradient id="sdFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                  <YAxis tickFormatter={compact} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                  <YAxis
                    yAxisId="docs"
                    orientation="right"
                    tick={{ fontSize: 11 }}
                    stroke="var(--color-muted-foreground)"
                  />
                  <Tooltip {...tooltipStyle} formatter={(v: number, n: string) => [n === "documents" ? NUM(v) : INR(v), n]} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-chart-1)"
                    fill="url(#sdFill)"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="docs"
                    type="monotone"
                    dataKey="documents"
                    stroke="var(--color-chart-3)"
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

            <Panel title="Revenue by profit centre" className="lg:col-span-2">
              <HBar data={analytics.byProfitCentre} valueLabel="Revenue" />
            </Panel>

            <Panel title="Revenue by segment">
              <Donut data={analytics.bySegment} />
            </Panel>

            <Panel title="Top customers">
              <HBar data={analytics.topCustomers} valueLabel="Revenue" />
            </Panel>

            <Panel title="Top materials">
              <HBar data={analytics.topMaterials} valueLabel="Revenue" />
            </Panel>

            <Panel title="Revenue by country">
              <HBar data={analytics.byCountry} valueLabel="Revenue" />
            </Panel>
          </div>

          <Panel
            title={`Document lines (${NUM(filtered.length)})`}
            actions={
              <Button variant="outline" size="sm" onClick={exportRows}>
                <Download className="mr-1 size-3.5" /> CSV
              </Button>
            }
          >
            <div className="max-h-[520px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                    {["Document", "Posting", "Customer", "Material", "Profit centre", "Type", "Country", "Qty", "Amount"].map(
                      (h) => (
                        <th key={h} className="px-2 py-2 font-medium">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 300).map((r: SdLine, i) => (
                    <tr key={`${r.docNo}-${r.material}-${i}`} className="border-b border-border/60">
                      <td className="px-2 py-1.5 tabular">{r.docNo}</td>
                      <td className="px-2 py-1.5">{r.postingDate}</td>
                      <td className="px-2 py-1.5">{r.customerName || r.customer}</td>
                      <td className="px-2 py-1.5">{r.materialDesc || r.material || "—"}</td>
                      <td className="px-2 py-1.5">{r.profitCtrName || r.profitCtr}</td>
                      <td className="px-2 py-1.5">{r.salesType || "—"}</td>
                      <td className="px-2 py-1.5">{r.countryName || "—"}</td>
                      <td className="tabular px-2 py-1.5 text-right">{NUM(r.quantity)}</td>
                      <td className="tabular px-2 py-1.5 text-right">{INR(r.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length > 300 ? (
                <p className="p-2 text-xs text-muted-foreground">
                  Showing the first 300 of {NUM(filtered.length)} lines — export to CSV for the full list.
                </p>
              ) : null}
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
