import { useMemo, useState } from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ReportShell, Panel, AccessDenied } from "@/components/report-shell";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getModuleReport } from "@/lib/sap.functions";
import { findModule, canAccessModule } from "@/lib/sap-modules";
import { useLaunchpad } from "@/lib/use-launchpad";

export const Route = createFileRoute("/_authenticated/reports/module/$module")({
  head: ({ params }) => {
    const def = findModule(params.module);
    const title = def ? `${def.title} Analytics — Nexus` : "Module Analytics — Nexus";
    const description = def?.description ?? "SAP module analytics in the Nexus portal.";
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
  beforeLoad: ({ params }) => {
    if (!findModule(params.module)) throw notFound();
  },
  component: ModuleReportPage,
  errorComponent: () => <p className="p-8 text-sm text-destructive">Unable to load this module report.</p>,
  notFoundComponent: () => <p className="p-8 text-sm text-muted-foreground">Unknown SAP module.</p>,
});

function compact(value: number) {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

function ModuleReportPage() {
  const { module } = Route.useParams();
  const def = findModule(module)!;
  const fetchReport = useServerFn(getModuleReport);
  const { data: launchpad, isLoading: rolesLoading } = useLaunchpad();
  const allowed = canAccessModule(module, launchpad?.roles);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["module-report", module],
    queryFn: () => fetchReport({ data: { module } }),
    enabled: allowed,
  });

  const report = data?.report ?? null;

  const rows = useMemo(() => {
    if (!report) return [];
    const term = search.trim().toLowerCase();
    if (!term) return report.rows.slice(0, 60);
    return report.rows
      .filter((row) =>
        [row.document, row.partner, row.dimension, row.site, row.status].some((v) =>
          v.toLowerCase().includes(term),
        ),
      )
      .slice(0, 60);
  }, [report, search]);

  return (
    <ReportShell
      title={`${def.code} — ${def.title}`}
      description={def.description}
      providerMode={data?.providerMode}
    >
      {!rolesLoading && !allowed ? (
        <AccessDenied area={`${def.code} — ${def.title}`} />
      ) : isLoading || !report ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-4">
            {report.kpis.map((kpi) => (
              <Panel key={kpi.key} title={kpi.label}>
                <p className="tabular text-3xl font-light text-primary">
                  {kpi.unit || kpi.value < 1000 ? kpi.value.toLocaleString() : compact(kpi.value)}
                  {kpi.unit ? <span className="ml-1 text-xs text-muted-foreground">{kpi.unit}</span> : null}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{kpi.subtitle}</p>
              </Panel>
            ))}
          </div>

          <Panel title={`${report.trendLabel} trend`} className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={report.trend}>
                <defs>
                  <linearGradient id="modFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <YAxis tickFormatter={compact} tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <Tooltip
                  formatter={(value: number) => compact(value)}
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
                  name={report.trendLabel}
                  dataKey="primary"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#modFill)"
                />
                <Area
                  type="monotone"
                  name={report.secondaryLabel}
                  dataKey="secondary"
                  stroke="var(--color-success)"
                  strokeWidth={2}
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title={report.breakdownLabel}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={report.breakdown} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tickFormatter={compact} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <Tooltip
                  formatter={(value: number) => compact(value)}
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

          <Panel title="Document list" className="lg:col-span-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents, partners, status…"
              className="mb-3 max-w-sm"
            />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    {report.columns.map((col) => (
                      <th key={col.key} className={`py-2 pr-4 font-medium ${col.numeric ? "text-right" : ""}`}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={`${row.document}-${i}`} className="border-b border-border/60 hover:bg-muted/40">
                      {report.columns.map((col) => {
                        const value = row[col.key as keyof typeof row];
                        return (
                          <td
                            key={col.key}
                            className={`py-2 pr-4 ${col.numeric ? "tabular text-right" : ""}`}
                          >
                            {col.numeric ? compact(Number(value)) : String(value)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">No documents match your search.</p>
              ) : null}
            </div>
          </Panel>
        </div>
      )}
    </ReportShell>
  );
}
