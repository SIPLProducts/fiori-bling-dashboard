import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CalendarRange,
  Factory,
  FileText,
  IndianRupee,
  Receipt,
  RotateCcw,
  Search,
  Target,
  Users,
  X,
} from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ReportShell, Panel, AccessDenied } from "@/components/report-shell";
import { ChartExportActions } from "@/components/chart-export-buttons";
import { MultiSelect } from "@/components/multi-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getSdSalesKpi } from "@/lib/sd-kpi.functions";
import type { SdKpiFilters } from "@/lib/sd-kpi";
import { SD_REPORTS, canAccessSdReport } from "@/lib/sd-reports";
import { useLaunchpad } from "@/lib/use-launchpad";


const DEF = SD_REPORTS.find((r) => r.key === "kpi")!;

export const Route = createFileRoute("/_authenticated/reports/sd/kpi")({
  head: () => {
    const title = `${DEF.title} (${DEF.tcode}) — Nexus`;
    const description =
      "Sales KPI dashboard from the SAP sales register: revenue, documents and customers filtered by posting date, profit center and plant.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: SalesKpiPage,
  errorComponent: () => <p className="p-8 text-sm text-destructive">Unable to load the sales KPI report.</p>,
});

const EMPTY: SdKpiFilters = { postingFrom: "", postingTo: "", profitCentres: [], plants: [] };

function inr(value: number) {
  return value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function compact(value: number) {
  if (Math.abs(value) >= 10_000_000) return `${(value / 10_000_000).toFixed(2)} Cr`;
  if (Math.abs(value) >= 100_000) return `${(value / 100_000).toFixed(1)} L`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return inr(value);
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

type KpiTone = "primary" | "info" | "success" | "violet" | "warning" | "teal";

type KpiCardModel = {
  label: string;
  value: string;
  hint: string;
  icon: typeof IndianRupee;
  tone: KpiTone;
  share?: number | undefined;
};

const TONE: Record<KpiTone, { surface: string; bar: string; chip: string; value: string }> = {
  primary: {
    surface: "from-primary/10 to-card",
    bar: "bg-primary",
    chip: "bg-primary/12 text-primary",
    value: "text-primary",
  },
  info: {
    surface: "from-chart-2/12 to-card",
    bar: "bg-chart-2",
    chip: "bg-chart-2/15 text-chart-2",
    value: "text-chart-2",
  },
  success: {
    surface: "from-success/12 to-card",
    bar: "bg-success",
    chip: "bg-success/15 text-success",
    value: "text-success",
  },
  violet: {
    surface: "from-chart-5/12 to-card",
    bar: "bg-chart-5",
    chip: "bg-chart-5/15 text-chart-5",
    value: "text-chart-5",
  },
  warning: {
    surface: "from-warning/15 to-card",
    bar: "bg-warning",
    chip: "bg-warning/20 text-warning",
    value: "text-warning",
  },
  teal: {
    surface: "from-chart-2/10 to-card",
    bar: "bg-chart-3",
    chip: "bg-chart-3/15 text-chart-3",
    value: "text-chart-3",
  },
};

const SERIES = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const TOOLTIP_STYLE = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
  boxShadow: "var(--shadow-tile-hover)",
} as const;

function KpiCard({ card }: { card: KpiCardModel }) {
  const tone = TONE[card.tone];
  const Icon = card.icon;
  return (
    <div
      className={`group relative overflow-hidden rounded-lg border border-border bg-gradient-to-br ${tone.surface} p-4 shadow-tile transition-all hover:-translate-y-0.5 hover:shadow-tile-hover`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${tone.bar}`} aria-hidden />
      <div className="flex items-start justify-between gap-3 pl-2">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{card.label}</p>
        <span className={`grid size-8 shrink-0 place-items-center rounded-md ${tone.chip}`}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className={`tabular mt-2 truncate pl-2 text-[26px] leading-tight font-semibold ${tone.value}`} title={card.value}>
        {card.value}
      </p>
      <p className="mt-1 pl-2 text-xs text-muted-foreground">{card.hint}</p>
      {typeof card.share === "number" ? (
        <div className="mt-3 ml-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <span
            className={`block h-full rounded-full ${tone.bar}`}
            style={{ width: `${Math.min(Math.max(card.share, 0), 100)}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}



function SalesKpiPage() {
  const { data: launchpad, isLoading: accessLoading } = useLaunchpad();
  const allowed = canAccessSdReport("kpi", launchpad?.screens);

  const [draft, setDraft] = useState<SdKpiFilters>(EMPTY);
  const [applied, setApplied] = useState<SdKpiFilters>(EMPTY);
  const [search, setSearch] = useState("");
  const trendRef = useRef<HTMLDivElement>(null);
  const plantRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["sd-sales-kpi", applied],
    queryFn: () => getSdSalesKpi({ data: applied }),
    enabled: allowed,
  });

  const centreOptions = useMemo(
    () => (data?.options.profitCentres ?? []).map((c) => ({ value: c.code, label: `${c.name} (${c.code})` })),
    [data],
  );
  const plantOptions = useMemo(
    () => (data?.options.plants ?? []).map((p) => ({ value: p, label: p })),
    [data],
  );

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const all = data?.rows ?? [];
    if (!term) return all.slice(0, 100);
    return all
      .filter((r) =>
        [r.docNo, r.customerName, r.profitCtrName, r.plant, r.salesType].some((v) =>
          v.toLowerCase().includes(term),
        ),
      )
      .slice(0, 100);
  }, [data, search]);

  function quickRange(kind: "month" | "quarter" | "fy") {
    const now = new Date();
    let from: Date;
    if (kind === "month") from = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (kind === "quarter") from = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    else from = new Date(now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1, 3, 1);
    const next = { ...draft, postingFrom: isoDate(from), postingTo: isoDate(now) };
    setDraft(next);
    setApplied(next);
  }

  const activeChips: { label: string; clear: () => void }[] = [];
  if (applied.postingFrom || applied.postingTo) {
    activeChips.push({
      label: `Posting ${applied.postingFrom || "…"} → ${applied.postingTo || "…"}`,
      clear: () => {
        const next = { ...applied, postingFrom: "", postingTo: "" };
        setDraft(next);
        setApplied(next);
      },
    });
  }
  for (const code of applied.profitCentres) {
    activeChips.push({
      label: `PC ${centreOptions.find((o) => o.value === code)?.label ?? code}`,
      clear: () => {
        const next = { ...applied, profitCentres: applied.profitCentres.filter((c) => c !== code) };
        setDraft(next);
        setApplied(next);
      },
    });
  }
  for (const plant of applied.plants) {
    activeChips.push({
      label: `Plant ${plant}`,
      clear: () => {
        const next = { ...applied, plants: applied.plants.filter((p) => p !== plant) };
        setDraft(next);
        setApplied(next);
      },
    });
  }

  const salesTypeMix = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of data?.rows ?? []) {
      map.set(row.salesType || "Unspecified", (map.get(row.salesType || "Unspecified") ?? 0) + row.amount);
    }
    const entries = [...map.entries()]
      .map(([name, value]) => ({ name, value, magnitude: Math.abs(value) }))
      .sort((a, b) => b.magnitude - a.magnitude);
    const total = entries.reduce((sum, e) => sum + e.magnitude, 0);
    return entries.map((e) => ({
      ...e,
      share: total ? Math.round((e.magnitude / total) * 100) : 0,
    }));
  }, [data]);


  const topPlant = data?.byPlant?.[0];
  const totalRevenue = data?.kpis.totalRevenue ?? 0;

  const kpiCards: KpiCardModel[] = data
    ? [
        {
          label: "Total sales value",
          value: `₹ ${compact(data.kpis.totalRevenue)}`,
          hint: `${inr(data.totalRows)} line items`,
          icon: IndianRupee,
          tone: "primary",
        },
        {
          label: "Documents",
          value: inr(data.kpis.documents),
          hint: `${inr(data.kpis.customers)} customers`,
          icon: FileText,
          tone: "info",
        },
        {
          label: "Average per document",
          value: `₹ ${compact(data.kpis.avgTicket)}`,
          hint: "Value / document",
          icon: Receipt,
          tone: "success",
        },
        {
          label: "Customers billed",
          value: inr(data.kpis.customers),
          hint: `${data.kpis.documents ? (data.kpis.documents / Math.max(data.kpis.customers, 1)).toFixed(1) : "0"} docs per customer`,
          icon: Users,
          tone: "violet",
        },
        {
          label: "Top profit center",
          value: data.kpis.topProfitCentre,
          hint: `${data.kpis.topProfitCentreShare}% of selection`,
          icon: Target,
          tone: "warning",
          share: data.kpis.topProfitCentreShare,
        },
        {
          label: "Top plant",
          value: topPlant?.name ?? "—",
          hint: topPlant ? `₹ ${compact(topPlant.value)} billed` : "No data",
          icon: Building2,
          tone: "teal",
          share: topPlant && totalRevenue ? Math.round((topPlant.value / totalRevenue) * 100) : undefined,
        },
      ]
    : [];


  return (
    <ReportShell title={DEF.title} tcode={DEF.tcode} description={DEF.description}>
      {!accessLoading && !allowed ? (
        <AccessDenied area={DEF.title} />
      ) : (
        <div className="space-y-4">
          {/* Filter bar */}
          <section className="sticky top-14 z-30 rounded-md border border-border bg-card/95 p-4 shadow-tile backdrop-blur">
            <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr_auto]">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  <CalendarRange className="size-3.5" /> Posting date
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={draft.postingFrom}
                    onChange={(e) => setDraft({ ...draft, postingFrom: e.target.value })}
                    className="h-9 rounded-sm"
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input
                    type="date"
                    value={draft.postingTo}
                    onChange={(e) => setDraft({ ...draft, postingTo: e.target.value })}
                    className="h-9 rounded-sm"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[
                    { key: "month", label: "This month" },
                    { key: "quarter", label: "This quarter" },
                    { key: "fy", label: "This FY" },
                  ].map((chip) => (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => quickRange(chip.key as "month" | "quarter" | "fy")}
                      className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  <Target className="size-3.5" /> Profit center
                </label>
                <MultiSelect
                  options={centreOptions}
                  selected={draft.profitCentres}
                  onChange={(next) => setDraft({ ...draft, profitCentres: next })}
                  placeholder="All profit centers"
                />
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      profitCentres:
                        draft.profitCentres.length === centreOptions.length
                          ? []
                          : centreOptions.map((o) => o.value),
                    })
                  }
                  className="mt-2 text-[11px] text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
                >
                  {draft.profitCentres.length === centreOptions.length && centreOptions.length
                    ? "Clear all"
                    : "Select all"}
                </button>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  <Factory className="size-3.5" /> Plant
                </label>
                <MultiSelect
                  options={plantOptions}
                  selected={draft.plants}
                  onChange={(next) => setDraft({ ...draft, plants: next })}
                  placeholder="All plants"
                />
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      plants: draft.plants.length === plantOptions.length ? [] : plantOptions.map((o) => o.value),
                    })
                  }
                  className="mt-2 text-[11px] text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
                >
                  {draft.plants.length === plantOptions.length && plantOptions.length ? "Clear all" : "Select all"}
                </button>
              </div>

              <div className="flex items-end gap-2">
                <Button type="button" className="h-9 rounded-sm" onClick={() => setApplied(draft)}>
                  Apply
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-sm"
                  onClick={() => {
                    setDraft(EMPTY);
                    setApplied(EMPTY);
                  }}
                >
                  <RotateCcw className="mr-1 size-3.5" /> Reset
                </Button>
              </div>
            </div>

            {activeChips.length ? (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
                <span className="text-[11px] tracking-wide text-muted-foreground uppercase">Active filters</span>
                {activeChips.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={chip.clear}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] text-primary transition-colors hover:bg-primary/20"
                  >
                    {chip.label}
                    <X className="size-3" />
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          {isLoading || !data ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-lg" />
                ))}
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                <Skeleton className="h-80 rounded-lg lg:col-span-2" />
                <Skeleton className="h-80 rounded-lg" />
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {kpiCards.map((card) => (
                  <KpiCard key={card.label} card={card} />
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <Panel
                  title="Sales trend by month"
                  className="lg:col-span-2"
                  actions={
                    <ChartExportActions rows={data.monthly} filename="sales-kpi-trend" containerRef={trendRef} />
                  }
                >
                  <div ref={trendRef}>
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={data.monthly}>
                        <defs>
                          <linearGradient id="sdKpiFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.45} />
                            <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                        <YAxis
                          yAxisId="value"
                          tickFormatter={compact}
                          tick={{ fontSize: 11 }}
                          stroke="var(--color-muted-foreground)"
                        />
                        <YAxis
                          yAxisId="docs"
                          orientation="right"
                          tick={{ fontSize: 11 }}
                          stroke="var(--color-muted-foreground)"
                          allowDecimals={false}
                        />
                        <Tooltip
                          formatter={(value: number, name: string) =>
                            name === "Documents" ? inr(value) : `₹ ${inr(value)}`
                          }
                          contentStyle={TOOLTIP_STYLE}
                        />
                        <Area
                          yAxisId="value"
                          type="monotone"
                          name="Revenue"
                          dataKey="revenue"
                          stroke="var(--color-chart-1)"
                          strokeWidth={2.5}
                          fill="url(#sdKpiFill)"
                        />
                        <Line
                          yAxisId="docs"
                          type="monotone"
                          name="Documents"
                          dataKey="documents"
                          stroke="var(--color-chart-4)"
                          strokeWidth={2}
                          strokeDasharray="4 3"
                          dot={{ r: 3, fill: "var(--color-chart-4)" }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>

                <Panel title="Sales mix by type">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Tooltip formatter={(value: number) => `₹ ${inr(value)}`} contentStyle={TOOLTIP_STYLE} />
                      <Pie
                        data={salesTypeMix}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={62}
                        outerRadius={98}
                        paddingAngle={2}
                        stroke="var(--color-card)"
                        strokeWidth={2}
                      >
                        {salesTypeMix.map((entry, i) => (
                          <Cell key={entry.name} fill={SERIES[i % SERIES.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="mt-2 space-y-1.5">
                    {salesTypeMix.slice(0, 5).map((entry, i) => (
                      <li key={entry.name} className="flex items-center gap-2 text-xs">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ background: SERIES[i % SERIES.length] }}
                          aria-hidden
                        />
                        <span className="truncate text-foreground">{entry.name}</span>
                        <span className="tabular ml-auto text-muted-foreground">
                          {totalRevenue ? Math.round((entry.value / totalRevenue) * 100) : 0}% · ₹ {compact(entry.value)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Panel>

                <Panel
                  title="Sales by plant"
                  actions={
                    <ChartExportActions rows={data.byPlant} filename="sales-kpi-plant" containerRef={plantRef} />
                  }
                >
                  <div ref={plantRef}>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={data.byPlant.slice(0, 8)} layout="vertical" margin={{ left: 12, right: 34 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                        <XAxis type="number" tickFormatter={compact} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                        <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                        <Tooltip
                          cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
                          formatter={(value: number) => `₹ ${inr(value)}`}
                          contentStyle={TOOLTIP_STYLE}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                          {data.byPlant.slice(0, 8).map((entry, i) => (
                            <Cell key={entry.name} fill={SERIES[i % SERIES.length]} />
                          ))}
                          <LabelList dataKey="value" position="right" formatter={compact} className="fill-muted-foreground text-[10px]" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>

                <Panel title="Sales by profit center" className="lg:col-span-2">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.byProfitCentre} margin={{ top: 16 }}>
                      <defs>
                        <linearGradient id="sdPcFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-chart-3)" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="var(--color-chart-3)" stopOpacity={0.45} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} height={50} textAnchor="end" stroke="var(--color-muted-foreground)" />
                      <YAxis tickFormatter={compact} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                      <Tooltip
                        cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
                        formatter={(value: number) => `₹ ${inr(value)}`}
                        contentStyle={TOOLTIP_STYLE}
                      />
                      {data.byProfitCentre.length ? (
                        <ReferenceLine
                          y={
                            data.byProfitCentre.reduce((sum, r) => sum + r.value, 0) / data.byProfitCentre.length
                          }
                          stroke="var(--color-chart-4)"
                          strokeDasharray="4 4"
                        />
                      ) : null}
                      <Bar dataKey="value" fill="url(#sdPcFill)" radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="value" position="top" formatter={compact} className="fill-muted-foreground text-[10px]" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Panel>


                <Panel
                  title={`Document list (${inr(data.totalRows)} lines)`}
                  className="lg:col-span-3"
                  actions={<ChartExportActions rows={data.rows} filename="sales-kpi-documents" containerRef={trendRef} />}
                >
                  <div className="relative mb-3 max-w-sm">
                    <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search document, customer, plant…"
                      className="h-9 rounded-sm pl-8"
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs text-muted-foreground">
                          <th className="py-2 pr-4 font-medium">Document</th>
                          <th className="py-2 pr-4 font-medium">Posting date</th>
                          <th className="py-2 pr-4 font-medium">Profit center</th>
                          <th className="py-2 pr-4 font-medium">Plant</th>
                          <th className="py-2 pr-4 font-medium">Customer</th>
                          <th className="py-2 pr-4 font-medium">Sales type</th>
                          <th className="py-2 pr-4 text-right font-medium">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => (
                          <tr key={`${row.docNo}-${i}`} className="border-b border-border/60 hover:bg-muted/40">
                            <td className="py-2 pr-4">{row.docNo}</td>
                            <td className="py-2 pr-4">{row.postingDate}</td>
                            <td className="py-2 pr-4">{row.profitCtrName}</td>
                            <td className="py-2 pr-4">{row.plant}</td>
                            <td className="py-2 pr-4">{row.customerName}</td>
                            <td className="py-2 pr-4">{row.salesType}</td>
                            <td className="tabular py-2 pr-4 text-right">₹ {inr(row.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {rows.length === 0 ? (
                      <p className="py-6 text-sm text-muted-foreground">No documents match the current selection.</p>
                    ) : null}
                  </div>
                </Panel>
              </div>
            </>
          )}
        </div>
      )}
    </ReportShell>
  );
}
