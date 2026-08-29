import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { ReportShell, Panel, AccessDenied } from "@/components/report-shell";

import { MultiSelect } from "@/components/multi-select";
import { ChartExportActions } from "@/components/chart-export-buttons";
import { DrilldownTable } from "@/components/drilldown-table";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { canAccessModule } from "@/lib/sap-modules";
import { useLaunchpad } from "@/lib/use-launchpad";
import { getSalesAnalytics, getSalesSyncStatus } from "@/lib/zfisales.functions";
import type {
  ComparisonBasis,
  SalesComparison,
  SalesFilters,
  SalesLine,
  SeriesBy,
} from "@/lib/zfisales-types";

export const Route = createFileRoute("/_authenticated/reports/sales-analytics")({
  head: () => {
    const title = "Sales Analytics — Nexus";
    const description =
      "Analytical dashboard for SAP sales register data: revenue by profit centre, segment, sales type and customer with posting-date, company code and fiscal-year filters.";
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
  component: SalesAnalyticsPage,
  errorComponent: () => <p className="p-8 text-sm text-destructive">Unable to load the sales analytics report.</p>,
  notFoundComponent: () => <p className="p-8 text-sm text-muted-foreground">Report not found.</p>,
});

type DatePreset = "last30" | "month" | "quarter" | "fy";

function isoDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const EMPTY: SalesFilters = {

  fiscalYear: "",
  companyCodes: [],
  profitCentres: [],
  salesTypes: [],
  segments: [],
  postingFrom: "",
  postingTo: "",
  search: "",
  seriesBy: "none",
};

const PIE_COLORS = [
  "var(--color-primary)",
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-accent)",
  "var(--color-destructive)",
];

const SERIES_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#F97316",
  "#EC4899",
];

const SERIES_LABELS: Record<SeriesBy, string> = {
  none: "None",
  companyCode: "Company code",
  profitCentre: "Profit centre",
};

function inr(value: number) {
  if (Math.abs(value) >= 10_000_000) return `${(value / 10_000_000).toFixed(2)} Cr`;
  if (Math.abs(value) >= 100_000) return `${(value / 100_000).toFixed(2)} L`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)} K`;
  return value.toFixed(0);
}


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</label>
      {children}
    </div>
  );
}

const BASIS_LABELS: Record<ComparisonBasis, string> = {
  yoy: "Year over year (YoY)",
  qoq: "Quarter over quarter (QoQ)",
  mom: "Month over month (MoM)",
};

/** Start/end calendar dates covered by a comparison period key. */
function periodRange(basis: ComparisonBasis, period: string) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
  if (basis === "yoy") return { start: `${period}-01-01`, end: `${period}-12-31` };
  if (basis === "qoq") {
    const [y, q] = period.split("-Q");
    const startM = (Number(q) - 1) * 3 + 1;
    const endM = startM + 2;
    return { start: `${y}-${pad(startM)}-01`, end: `${y}-${pad(endM)}-${pad(lastDay(Number(y), endM))}` };
  }
  const [y, m] = period.split("-");
  return { start: `${y}-${m}-01`, end: `${y}-${m}-${pad(lastDay(Number(y), Number(m)))}` };
}

function ComparisonPanel({ comparison }: { comparison: SalesComparison }) {
  const [basis, setBasis] = useState<ComparisonBasis>("yoy");
  const [scope, setScope] = useState<"all" | "selection">("all");
  const [limit, setLimit] = useState("12");
  const [trend, setTrend] = useState<"all" | "up" | "down">("all");
  const [windowMode, setWindowMode] = useState<"auto" | "custom">("auto");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const chartRef = useRef<HTMLDivElement | null>(null);

  const dateError =
    windowMode === "custom" && customFrom && customTo && customFrom > customTo
      ? "Start date must be on or before the end date."
      : "";

  const points = useMemo(() => {
    const base = comparison[scope][basis];
    let filtered = base.filter((p) =>
      trend === "all" ? true : trend === "up" ? p.delta > 0 : p.delta < 0,
    );
    if (windowMode === "custom" && !dateError && (customFrom || customTo)) {
      filtered = filtered.filter((p) => {
        const { start, end } = periodRange(basis, p.period);
        if (customFrom && end < customFrom) return false;
        if (customTo && start > customTo) return false;
        return true;
      });
      return filtered;
    }
    const n = Number(limit);
    return Number.isFinite(n) && n > 0 ? filtered.slice(-n) : filtered;
  }, [comparison, scope, basis, limit, trend, windowMode, customFrom, customTo, dateError]);


  const totals = useMemo(() => {
    const current = points.reduce((s, p) => s + p.current, 0);
    const previous = points.reduce((s, p) => s + p.previous, 0);
    return {
      current,
      previous,
      deltaPct: previous ? Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10 : null,
    };
  }, [points]);

  const selectCls = "h-8 rounded-sm border border-input bg-background px-2 text-xs text-foreground";

  return (
    <Panel
      title={`Period comparison — ${BASIS_LABELS[basis]}`}
      actions={
        <ChartExportActions
          rows={points.map((p) => ({
            Period: p.label,
            "Compared with": p.previousLabel,
            Current: p.current,
            Previous: p.previous,
            Delta: p.delta,
            "Delta %": p.deltaPct ?? "",
            Documents: p.documents,
          }))}
          filename={`comparison-${basis}-${scope}`}
          containerRef={chartRef}
        />
      }
    >
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
          Comparison
          <select value={basis} onChange={(e) => setBasis(e.target.value as ComparisonBasis)} className={selectCls}>
            <option value="yoy">YoY — year over year</option>
            <option value="qoq">QoQ — quarter over quarter</option>
            <option value="mom">MoM — month over month</option>
          </select>
        </label>
        <label className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
          Period scope
          <select value={scope} onChange={(e) => setScope(e.target.value as "all" | "selection")} className={selectCls}>
            <option value="all">All history (ignores FY / posting dates)</option>
            <option value="selection">Current selection only</option>
          </select>
        </label>
        <label className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
          Period window
          <select
            value={windowMode}
            onChange={(e) => setWindowMode(e.target.value as "auto" | "custom")}
            className={selectCls}
          >
            <option value="auto">Latest periods</option>
            <option value="custom">Custom date range</option>
          </select>
        </label>
        {windowMode === "auto" ? (
          <label className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
            Periods shown
            <select value={limit} onChange={(e) => setLimit(e.target.value)} className={selectCls}>
              <option value="4">Last 4</option>
              <option value="6">Last 6</option>
              <option value="12">Last 12</option>
              <option value="0">All</option>
            </select>
          </label>
        ) : (
          <>
            <label className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
              Window start
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className={selectCls}
              />
            </label>
            <label className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
              Window end
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className={selectCls}
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setCustomFrom("");
                setCustomTo("");
              }}
              className="h-8 rounded-sm border border-input px-2 text-xs text-muted-foreground hover:bg-muted"
            >
              Clear dates
            </button>
          </>
        )}

        <label className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
          Movement
          <select value={trend} onChange={(e) => setTrend(e.target.value as "all" | "up" | "down")} className={selectCls}>
            <option value="all">All periods</option>
            <option value="up">Growth only</option>
            <option value="down">Decline only</option>
          </select>
        </label>
        <p className="ml-auto text-xs text-muted-foreground">
          {inr(totals.current)} vs {inr(totals.previous)} INR ·{" "}
          <span
            className={
              totals.deltaPct === null
                ? "text-muted-foreground"
                : totals.deltaPct >= 0
                  ? "text-success"
                  : "text-destructive"
            }
          >
            {totals.deltaPct === null ? "—" : `${totals.deltaPct > 0 ? "+" : ""}${totals.deltaPct}%`}
          </span>
        </p>
      </div>

      {dateError ? <p className="mb-2 text-xs text-destructive">{dateError}</p> : null}
      {!dateError && windowMode === "custom" && points.length === 0 ? (
        <p className="mb-2 text-xs text-muted-foreground">No {BASIS_LABELS[basis]} periods fall in the selected window.</p>
      ) : null}



      <div ref={chartRef} className="bg-card">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={points}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
            <YAxis tickFormatter={inr} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
            <Tooltip
              formatter={(value: number, name: string) => [`${inr(value)} INR`, name]}
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 6,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="previous" name="Previous period" fill="var(--color-muted-foreground)" radius={[3, 3, 0, 0]}>
              <LabelList dataKey="previous" formatter={(v: number) => inr(v)} position="top" fontSize={10} fill="var(--color-muted-foreground)" />
            </Bar>
            <Bar dataKey="current" name="Current period" fill="var(--color-primary)" radius={[3, 3, 0, 0]}>
              <LabelList dataKey="current" formatter={(v: number) => inr(v)} position="top" fontSize={10} fill="var(--color-foreground)" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 max-h-64 overflow-auto rounded-sm border border-border">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted/60">
            <tr className="text-left text-muted-foreground">
              <th className="px-2 py-1.5 font-medium">Period</th>
              <th className="px-2 py-1.5 font-medium">Compared with</th>
              <th className="px-2 py-1.5 text-right font-medium">Current</th>
              <th className="px-2 py-1.5 text-right font-medium">Previous</th>
              <th className="px-2 py-1.5 text-right font-medium">Δ</th>
              <th className="px-2 py-1.5 text-right font-medium">Δ %</th>
              <th className="px-2 py-1.5 text-right font-medium">Documents</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.period} className="border-t border-border/60">
                <td className="px-2 py-1.5">{p.label}</td>
                <td className="px-2 py-1.5 text-muted-foreground">{p.previousLabel}</td>
                <td className="px-2 py-1.5 text-right tabular">{inr(p.current)}</td>
                <td className="px-2 py-1.5 text-right tabular">{inr(p.previous)}</td>
                <td
                  className={`px-2 py-1.5 text-right tabular ${p.delta >= 0 ? "text-success" : "text-destructive"}`}
                >
                  {p.delta > 0 ? "+" : ""}
                  {inr(p.delta)}
                </td>
                <td
                  className={`px-2 py-1.5 text-right tabular ${
                    p.deltaPct === null ? "text-muted-foreground" : p.deltaPct >= 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  {p.deltaPct === null ? "—" : `${p.deltaPct > 0 ? "+" : ""}${p.deltaPct}%`}
                </td>
                <td className="px-2 py-1.5 text-right tabular">{p.documents}</td>
              </tr>
            ))}
            {points.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-2 py-4 text-center text-muted-foreground">
                  No periods match this comparison.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}


function SalesAnalyticsPage() {
  const fetchAnalytics = getSalesAnalytics;
  const { data: launchpad, isLoading: rolesLoading } = useLaunchpad();
  const allowed = canAccessModule("sd", launchpad?.screens);

  const [draft, setDraft] = useState<SalesFilters>(EMPTY);
  const [applied, setApplied] = useState<SalesFilters>(EMPTY);
  const [filtersOpen, setFiltersOpen] = useState(true);


  const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);

  const monthlyRef = useRef<HTMLDivElement | null>(null);
  const salesTypeRef = useRef<HTMLDivElement | null>(null);
  const dimensionRef = useRef<HTMLDivElement | null>(null);
  const segmentRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["zfisales", applied],
    queryFn: () => fetchAnalytics({ data: applied }),
    enabled: allowed,
  });

  const { data: syncStatus } = useQuery({
    queryKey: ["zfisales-sync-status"],
    queryFn: getSalesSyncStatus,
    enabled: allowed,
    refetchInterval: 60_000,
  });

  const options = data?.options;


  useEffect(() => {
    setHiddenSeries([]);
  }, [applied.seriesBy, applied.companyCodes, applied.profitCentres]);

  const monthlyExportRows = useMemo(() => {
    if (!data) return [] as Array<Record<string, unknown>>;
    if (data.series.keys.length) {
      return data.series.monthly.map((row: Record<string, unknown>) => {
        const out: Record<string, unknown> = { Month: row['month'] };
        for (const key of data.series.keys) {
          out[data.series.keyLabels[key] ?? key] = row[key] ?? 0;
        }
        return out;
      });
    }
    return data.monthly.map((row) => ({ Month: row.month, Revenue: row.revenue }));
  }, [data]);


  const pick = (key: "companyCodes" | "profitCentres" | "salesTypes" | "segments", value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value ? [value] : [] }));

  const dateError = useMemo(() => {
    if (!draft.postingFrom || !draft.postingTo) return "";
    if (draft.postingFrom > draft.postingTo) {
      return "Posting date from must be earlier than or equal to posting date to.";
    }
    return "";
  }, [draft.postingFrom, draft.postingTo]);

  const activeCount = useMemo(() => {
    return (
      (applied.fiscalYear ? 1 : 0) +
      applied.companyCodes.length +
      applied.profitCentres.length +
      applied.salesTypes.length +
      applied.segments.length +
      (applied.postingFrom ? 1 : 0) +
      (applied.postingTo ? 1 : 0) +
      (applied.search ? 1 : 0) +
      (applied.seriesBy !== "none" ? 1 : 0)
    );
  }, [applied]);

  const applyRange = (from: Date, to: Date) => {
    const next = { ...draft, postingFrom: isoDay(from), postingTo: isoDay(to) };
    setDraft(next);
    setApplied(next);
  };

  const applyPreset = (preset: DatePreset) => {
    const now = new Date();
    if (preset === "last30") {
      const from = new Date(now);
      from.setDate(from.getDate() - 29);
      applyRange(from, now);
      return;
    }
    if (preset === "month") {
      applyRange(new Date(now.getFullYear(), now.getMonth(), 1), now);
      return;
    }
    if (preset === "quarter") {
      applyRange(new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1), now);
      return;
    }
    const fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    applyRange(new Date(fyStartYear, 3, 1), now);
  };

  const activeChips: Array<{ key: string; label: string; clear: () => void }> = [];
  const clearFilter = (patch: Partial<SalesFilters>) => {
    setDraft((p) => ({ ...p, ...patch }));
    setApplied((p) => ({ ...p, ...patch }));
  };
  if (applied.fiscalYear)
    activeChips.push({
      key: "fy",
      label: `Fiscal year: ${applied.fiscalYear}`,
      clear: () => clearFilter({ fiscalYear: "" }),
    });
  if (applied.postingFrom || applied.postingTo)
    activeChips.push({
      key: "dates",
      label: `Posting: ${applied.postingFrom || "…"} → ${applied.postingTo || "…"}`,
      clear: () => clearFilter({ postingFrom: "", postingTo: "" }),
    });
  for (const code of applied.companyCodes)
    activeChips.push({
      key: `cc-${code}`,
      label: `Company: ${code}`,
      clear: () => clearFilter({ companyCodes: applied.companyCodes.filter((c) => c !== code) }),
    });
  for (const pc of applied.profitCentres)
    activeChips.push({
      key: `pc-${pc}`,
      label: `Profit centre: ${pc}`,
      clear: () => clearFilter({ profitCentres: applied.profitCentres.filter((c) => c !== pc) }),
    });
  for (const t of applied.salesTypes)
    activeChips.push({ key: `st-${t}`, label: `Sales type: ${t}`, clear: () => clearFilter({ salesTypes: [] }) });
  for (const s of applied.segments)
    activeChips.push({ key: `sg-${s}`, label: `Segment: ${s}`, clear: () => clearFilter({ segments: [] }) });
  if (applied.search)
    activeChips.push({
      key: "search",
      label: `Search: ${applied.search}`,
      clear: () => clearFilter({ search: "" }),
    });
  if (applied.seriesBy !== "none")
    activeChips.push({
      key: "series",
      label: `Series: ${applied.seriesBy === "companyCode" ? "Company code" : "Profit centre"}`,
      clear: () => clearFilter({ seriesBy: "none" }),
    });


  return (
    <ReportShell
      title="SD — Sales Analytics"
      description="Sales register analysis by posting date, company code, profit centre, fiscal year, segment and customer."
    >
      {allowed && syncStatus ? (
        <p className="mb-3 text-xs text-muted-foreground">
          Source: <span className="font-medium text-foreground">{syncStatus.source === "ZFISALES_DETAIL" ? "ZFISALES_DETAIL" : "ZFISALES_DETAIL — no data yet (awaiting first SAP sync)"}</span>
          {syncStatus.rowCount ? ` · ${syncStatus.rowCount.toLocaleString()} rows` : ""}
          {syncStatus.lastSyncedAt ? ` · last synced ${new Date(syncStatus.lastSyncedAt).toLocaleString()}` : ""}
          {syncStatus.lastStatus && syncStatus.lastStatus !== "success" ? ` · last run ${syncStatus.lastStatus}` : ""}
        </p>
      ) : null}
      {!rolesLoading && !allowed ? (
        <AccessDenied area="SD — Sales Analytics" />
      ) : (
        <div className="space-y-4">
          {/* Selection screen */}
          <section className="rounded-md border border-border bg-card p-4 shadow-tile">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                className="flex items-center gap-2 text-sm font-medium text-card-foreground"
                aria-expanded={filtersOpen}
              >
                <SlidersHorizontal className="size-4 text-primary" />
                Selection criteria
                <ChevronDown className={`size-4 text-muted-foreground transition-transform ${filtersOpen ? "" : "-rotate-90"}`} />
              </button>
              {activeCount ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {activeCount} active
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">No filters applied</span>
              )}

              <div className="ml-auto flex flex-wrap items-center gap-1.5">
                {([
                  ["last30", "Last 30 days"],
                  ["month", "This month"],
                  ["quarter", "This quarter"],
                  ["fy", "This FY"],
                ] as Array<[DatePreset, string]>).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyPreset(key)}
                    className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {activeChips.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {activeChips.map((chip) => (
                  <span
                    key={chip.key}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-foreground"
                  >
                    {chip.label}
                    <button type="button" onClick={chip.clear} aria-label={`Remove ${chip.label}`}>
                      <X className="size-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}

            {filtersOpen ? (
            <div className="mt-4 grid gap-4 md:grid-cols-4">

              <Field label="Fiscal year">
                <select
                  value={draft.fiscalYear}
                  onChange={(e) => setDraft((p) => ({ ...p, fiscalYear: e.target.value }))}
                  className="h-9 w-full rounded-sm border border-input bg-background px-2 text-sm"
                >
                  <option value="">All</option>
                  {(options?.fiscalYears ?? []).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Posting date from">
                <Input
                  type="date"
                  value={draft.postingFrom}
                  min={options?.postingMin}
                  max={options?.postingMax}
                  onChange={(e) => setDraft((p) => ({ ...p, postingFrom: e.target.value }))}
                />
              </Field>

              <Field label="Posting date to">
                <Input
                  type="date"
                  value={draft.postingTo}
                  min={options?.postingMin}
                  max={options?.postingMax}
                  onChange={(e) => setDraft((p) => ({ ...p, postingTo: e.target.value }))}
                />
              </Field>

              <Field label="Customer / document search">
                <Input
                  value={draft.search}
                  placeholder="Customer, doc no, reference…"
                  onChange={(e) => setDraft((p) => ({ ...p, search: e.target.value }))}
                />
              </Field>

              <Field label="Company code">
                <MultiSelect
                  options={(options?.companies ?? []).map((c) => ({ value: c.code, label: `${c.code} · ${c.name}` }))}
                  selected={draft.companyCodes}
                  onChange={(next) => setDraft((p) => ({ ...p, companyCodes: next }))}
                  placeholder="All company codes"
                />
              </Field>

              <Field label="Profit centre">
                <MultiSelect
                  options={(options?.profitCentres ?? []).map((c) => ({ value: c.code, label: `${c.code} · ${c.name}` }))}
                  selected={draft.profitCentres}
                  onChange={(next) => setDraft((p) => ({ ...p, profitCentres: next }))}
                  placeholder="All profit centres"
                />
              </Field>


              <Field label="Sales type">
                <select
                  value={draft.salesTypes[0] ?? ""}
                  onChange={(e) => pick("salesTypes", e.target.value)}
                  className="h-9 w-full rounded-sm border border-input bg-background px-2 text-sm"
                >
                  <option value="">All</option>
                  {(options?.salesTypes ?? []).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Segment">
                <select
                  value={draft.segments[0] ?? ""}
                  onChange={(e) => pick("segments", e.target.value)}
                  className="h-9 w-full rounded-sm border border-input bg-background px-2 text-sm"
                >
                  <option value="">All</option>
                  {(options?.segments ?? []).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Series by">
                <select
                  value={draft.seriesBy}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, seriesBy: e.target.value as SeriesBy }))
                  }
                  className="h-9 w-full rounded-sm border border-input bg-background px-2 text-sm"
                >
                  <option value="none">None (aggregate)</option>
                  <option value="companyCode">Company code</option>
                  <option value="profitCentre">Profit centre</option>
                </select>
              </Field>

            </div>
            ) : null}

            {filtersOpen && dateError ? (
              <p className="mt-3 text-xs text-destructive" role="alert">
                {dateError}
              </p>
            ) : null}

            {filtersOpen ? (
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={() => setApplied(draft)} disabled={isFetching || Boolean(dateError)}>
                  {isFetching ? "Executing…" : "Execute"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDraft(EMPTY);
                    setApplied(EMPTY);
                  }}
                >
                  Reset
                </Button>
              </div>
            ) : null}
          </section>


          {isLoading || !data ? (
            <div className="grid gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Panel title="Total revenue">
                  <p className="tabular text-3xl font-light text-primary">
                    {inr(data.kpis.totalRevenue)}
                    <span className="ml-1 text-xs text-muted-foreground">INR</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Local currency, filtered selection</p>
                </Panel>
                <Panel title="Billing documents">
                  <p className="tabular text-3xl font-light text-primary">{data.kpis.documents}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{data.totalRows} line items</p>
                </Panel>
                <Panel title="Customers">
                  <p className="tabular text-3xl font-light text-primary">{data.kpis.customers}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Avg document {inr(data.kpis.avgTicket)} INR
                  </p>
                </Panel>
                <Panel title="Export share">
                  <p className="tabular text-3xl font-light text-primary">
                    {data.kpis.exportShare}
                    <span className="ml-1 text-xs text-muted-foreground">%</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Top segment {data.bySegment[0]?.name ?? "—"} · {data.kpis.topSegmentShare}%
                  </p>
                </Panel>
              </div>

              <ComparisonPanel comparison={data.comparison} />



              <div className="grid gap-4 lg:grid-cols-3">
                <Panel
                  title={
                    data.series.keys.length
                      ? `Revenue by posting month — ${SERIES_LABELS[data.series.dimension]}`
                      : "Revenue by posting month"
                  }
                  className="lg:col-span-2"
                  actions={
                    <ChartExportActions
                      rows={monthlyExportRows}
                      filename="revenue-by-posting-month"
                      containerRef={monthlyRef}
                    />
                  }
                >
                  <div ref={monthlyRef} className="bg-card">
                  <ResponsiveContainer width="100%" height={300}>
                    {data.series.keys.length ? (
                      <LineChart data={data.series.monthly}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                        <YAxis tickFormatter={inr} tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            `${inr(value)} INR`,
                            data.series.keyLabels[name] ?? name,
                          ]}
                          contentStyle={{
                            background: "var(--color-card)",
                            border: "1px solid var(--color-border)",
                            borderRadius: 6,
                            fontSize: 12,
                          }}
                        />
                        <Legend
                          formatter={(name: string) => (
                            <span
                              style={{
                                opacity: hiddenSeries.includes(name) ? 0.45 : 1,
                                textDecoration: hiddenSeries.includes(name) ? "line-through" : "none",
                                cursor: "pointer",
                              }}
                            >
                              {data.series.keyLabels[name] ?? name}
                            </span>
                          )}
                          onClick={(entry) => {
                            const key = String((entry as { dataKey?: string }).dataKey ?? "");
                            if (!key) return;
                            setHiddenSeries((prev) =>
                              prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
                            );
                          }}
                          wrapperStyle={{ fontSize: 12, cursor: "pointer" }}
                        />
                        {data.series.keys.map((key, i) => (
                          <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            name={key}
                            stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                            hide={hiddenSeries.includes(key)}
                          >
                            <LabelList dataKey={key} formatter={(v: number) => inr(v)} position="top" fontSize={9} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
                          </Line>
                        ))}

                      </LineChart>
                    ) : (
                      <AreaChart data={data.monthly}>
                        <defs>
                          <linearGradient id="sdFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                        <YAxis tickFormatter={inr} tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                        <Tooltip
                          formatter={(value: number) => `${inr(value)} INR`}
                          contentStyle={{
                            background: "var(--color-card)",
                            border: "1px solid var(--color-border)",
                            borderRadius: 6,
                            fontSize: 12,
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Area
                          type="monotone"
                          name="Revenue"
                          dataKey="revenue"
                          stroke="var(--color-primary)"
                          strokeWidth={2}
                          fill="url(#sdFill)"
                        >
                          <LabelList dataKey="revenue" formatter={(v: number) => inr(v)} position="top" fontSize={10} fill="var(--color-foreground)" />
                        </Area>
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                  </div>
                  <DrilldownTable
                    rows={data.rows}
                    groupLabel="Month"
                    groupBy={(r) => r.month}
                    {...(data.series.dimension === "companyCode"
                      ? { splitBy: (r: SalesLine) => `${r.companyCode} · ${r.companyName}`, splitLabel: "Company code" }
                      : data.series.dimension === "profitCentre"
                        ? { splitBy: (r: SalesLine) => `${r.profitCtr} · ${r.profitCtrName}`, splitLabel: "Profit centre" }
                        : {})}
                  />
                </Panel>

                <Panel
                  title="Revenue by sales type"
                  actions={
                    <ChartExportActions
                      rows={data.bySalesType.map((r) => ({ "Sales type": r.name, Revenue: r.value }))}
                      filename="revenue-by-sales-type"
                      containerRef={salesTypeRef}
                    />
                  }
                >
                  <div ref={salesTypeRef} className="bg-card">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.bySalesType}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        label={(entry: { name: string; value: number; percent?: number }) =>
                          `${entry.name}: ${Math.round((entry.percent ?? 0) * 100)}%`
                        }
                        labelLine
                      >
                        {data.bySalesType.map((entry, i) => (
                          <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => `${inr(value)} INR`}
                        contentStyle={{
                          background: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 6,
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  </div>
                  <DrilldownTable rows={data.rows} groupLabel="Sales type" groupBy={(r) => r.salesType} />
                </Panel>

                <Panel
                  title={
                    data.series.dimension === "companyCode"
                      ? "Revenue by company code"
                      : data.series.dimension === "profitCentre"
                        ? "Revenue by profit centre"
                        : "Revenue by profit centre"
                  }
                  actions={
                    <ChartExportActions
                      rows={(data.series.keys.length ? data.series.byDimension : data.byProfitCentre).map(
                        (r) => ({ Dimension: r.name, Revenue: r.value }),
                      )}
                      filename="revenue-by-dimension"
                      containerRef={dimensionRef}
                    />
                  }
                >
                  <div ref={dimensionRef} className="bg-card">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={data.series.keys.length ? data.series.byDimension : data.byProfitCentre}
                      layout="vertical"
                      margin={{ left: 24 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                      <XAxis type="number" tickFormatter={inr} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                      <Tooltip
                        formatter={(value: number) => `${inr(value)} INR`}
                        contentStyle={{
                          background: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 6,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="value" fill="var(--color-primary)" radius={[0, 3, 3, 0]}>
                        <LabelList dataKey="value" formatter={(v: number) => inr(v)} position="right" fontSize={10} fill="var(--color-foreground)" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  </div>
                  <DrilldownTable
                    rows={data.rows}
                    groupLabel={data.series.dimension === "companyCode" ? "Company code" : "Profit centre"}
                    groupBy={(r) =>
                      data.series.dimension === "companyCode"
                        ? `${r.companyCode} · ${r.companyName}`
                        : `${r.profitCtr} · ${r.profitCtrName}`
                    }
                  />
                </Panel>

                <Panel
                  title="Revenue by segment"
                  actions={
                    <ChartExportActions
                      rows={data.bySegment.map((r) => ({ Segment: r.name, Revenue: r.value }))}
                      filename="revenue-by-segment"
                      containerRef={segmentRef}
                    />
                  }
                >
                  <div ref={segmentRef} className="bg-card">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.bySegment}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                      <YAxis tickFormatter={inr} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                      <Tooltip
                        formatter={(value: number) => `${inr(value)} INR`}
                        contentStyle={{
                          background: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 6,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="value" fill="var(--color-success)" radius={[3, 3, 0, 0]}>
                        <LabelList dataKey="value" formatter={(v: number) => inr(v)} position="top" fontSize={10} fill="var(--color-foreground)" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  </div>
                  <DrilldownTable rows={data.rows} groupLabel="Segment" groupBy={(r) => r.segment} />
                </Panel>

                <Panel title="Top customers">
                  <ul className="space-y-2">
                    {data.topCustomers.map((c) => (
                      <li key={c.name} className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate text-card-foreground">{c.name}</span>
                        <span className="tabular text-muted-foreground">{inr(c.value)}</span>
                      </li>
                    ))}
                    {data.topCustomers.length === 0 ? (
                      <li className="text-sm text-muted-foreground">No data for this selection.</li>
                    ) : null}
                  </ul>
                </Panel>
              </div>

              <Panel title={`Sales register — ${data.totalRows} line items`}>
                <div className="max-h-[520px] overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card">
                      <tr className="border-b border-border text-left text-xs text-muted-foreground">
                        <th className="py-2 pr-3 font-medium">G/L</th>
                        <th className="py-2 pr-3 font-medium">G/L name</th>
                        <th className="py-2 pr-3 font-medium">Profit centre</th>
                        <th className="py-2 pr-3 font-medium">Group</th>
                        <th className="py-2 pr-3 font-medium">Sales type</th>
                        <th className="py-2 pr-3 font-medium">Customer</th>
                        <th className="py-2 pr-3 font-medium">FY</th>
                        <th className="py-2 pr-3 font-medium">Document</th>
                        <th className="py-2 pr-3 font-medium">Doc date</th>
                        <th className="py-2 pr-3 font-medium">Posting date</th>
                        <th className="py-2 pr-3 font-medium">Month</th>
                        <th className="py-2 pr-3 font-medium">Reference</th>
                        <th className="py-2 pr-3 font-medium">Type</th>
                        <th className="py-2 pr-3 font-medium">PK</th>
                        <th className="py-2 pr-3 text-right font-medium">Amount (LC)</th>
                        <th className="py-2 pr-3 font-medium">Segment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((row, i) => (
                        <tr key={`${row.docNo}-${i}`} className="border-b border-border/60 hover:bg-muted/40">
                          <td className="py-2 pr-3 tabular">{row.gl}</td>
                          <td className="py-2 pr-3">{row.glName}</td>
                          <td className="py-2 pr-3">
                            <span className="tabular">{row.profitCtr}</span>
                            <span className="block text-xs text-muted-foreground">{row.profitCtrName}</span>
                          </td>
                          <td className="py-2 pr-3">{row.group}</td>
                          <td className="py-2 pr-3">{row.salesType}</td>
                          <td className="py-2 pr-3">
                            <span className="tabular">{row.customer}</span>
                            <span className="block text-xs text-muted-foreground">{row.customerName}</span>
                          </td>
                          <td className="py-2 pr-3 tabular">{row.fiscalYear}</td>
                          <td className="py-2 pr-3 tabular">{row.docNo}</td>
                          <td className="py-2 pr-3 tabular">{row.docDate}</td>
                          <td className="py-2 pr-3 tabular">{row.postingDate}</td>
                          <td className="py-2 pr-3">{row.month}</td>
                          <td className="py-2 pr-3 tabular">{row.reference}</td>
                          <td className="py-2 pr-3">{row.docType}</td>
                          <td className="py-2 pr-3 tabular">{row.pk}</td>
                          <td className="py-2 pr-3 tabular text-right">{row.amount.toLocaleString("en-IN")}</td>
                          <td className="py-2 pr-3">{row.segment}</td>
                        </tr>
                      ))}
                      {data.rows.length === 0 ? (
                        <tr>
                          <td colSpan={16} className="py-6 text-center text-sm text-muted-foreground">
                            No documents match the selection criteria.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </>
          )}
        </div>
      )}
    </ReportShell>
  );
}
