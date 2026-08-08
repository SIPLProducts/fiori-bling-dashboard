import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import { ReportShell, Panel, AccessDenied } from "@/components/report-shell";
import { MultiSelect } from "@/components/multi-select";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { canAccessModule } from "@/lib/sap-modules";
import { useLaunchpad } from "@/lib/use-launchpad";
import { getSalesAnalytics } from "@/lib/zfisales.functions";
import type { SalesFilters, SeriesBy } from "@/lib/zfisales-types";

export const Route = createFileRoute("/_authenticated/reports/sales-analytics")({
  head: () => {
    const title = "ZFISALES Sales Analytics — Nexus";
    const description =
      "Analytical dashboard for the SAP ZFISALES sales register: revenue by profit centre, segment, sales type and customer with posting-date, company code and fiscal-year filters.";
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

function SalesAnalyticsPage() {
  const fetchAnalytics = useServerFn(getSalesAnalytics);
  const { data: launchpad, isLoading: rolesLoading } = useLaunchpad();
  const allowed = canAccessModule("sd", launchpad?.roles);

  const [draft, setDraft] = useState<SalesFilters>(EMPTY);
  const [applied, setApplied] = useState<SalesFilters>(EMPTY);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["zfisales", applied],
    queryFn: () => fetchAnalytics({ data: applied }),
    enabled: allowed,
  });

  const options = data?.options;

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
      (applied.search ? 1 : 0)
    );
  }, [applied]);

  return (
    <ReportShell
      title="SD — ZFISALES Sales Analytics"
      description="Sales register analysis by posting date, company code, profit centre, fiscal year, segment and customer."
    >
      {!rolesLoading && !allowed ? (
        <AccessDenied area="SD — Sales Analytics" />
      ) : (
        <div className="space-y-4">
          {/* Selection screen */}
          <section className="rounded-md border border-border bg-card p-4 shadow-tile">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-card-foreground">Selection criteria</h2>
              <span className="text-xs text-muted-foreground">
                {activeCount ? `${activeCount} filter${activeCount > 1 ? "s" : ""} applied` : "No filters applied"}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
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

            </div>

            {dateError ? (
              <p className="mt-3 text-xs text-destructive" role="alert">
                {dateError}
              </p>
            ) : null}

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

              <div className="grid gap-4 lg:grid-cols-3">
                <Panel title="Revenue by posting month" className="lg:col-span-2">
                  <ResponsiveContainer width="100%" height={300}>
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
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Panel>

                <Panel title="Revenue by sales type">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.bySalesType}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
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
                </Panel>

                <Panel title="Revenue by profit centre">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.byProfitCentre} layout="vertical" margin={{ left: 24 }}>
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
                      <Bar dataKey="value" fill="var(--color-primary)" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Panel>

                <Panel title="Revenue by segment">
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
                      <Bar dataKey="value" fill="var(--color-success)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
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
