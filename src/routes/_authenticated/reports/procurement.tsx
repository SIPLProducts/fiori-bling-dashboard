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
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getProcurementOverview } from "@/lib/sap.functions";
import { Panel, ReportShell, AccessDenied } from "@/components/report-shell";
import { canAccessPath } from "@/lib/nav";
import { useLaunchpad } from "@/lib/use-launchpad";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/reports/procurement")({
  head: () => ({
    meta: [
      { title: "Procurement Overview — Nexus Analytics" },
      {
        name: "description",
        content: "Spend trend, savings, category split and top supplier analysis from SAP procurement data.",
      },
      { property: "og:title", content: "Procurement Overview — Nexus Analytics" },
      { property: "og:description", content: "SAP spend trend, category split and top supplier analytics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProcurementOverview,
});

const PIE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);

function ProcurementOverview() {
  const fetchOverview = useServerFn(getProcurementOverview);
  const { data: launchpad, isLoading: rolesLoading } = useLaunchpad();
  const allowed = canAccessPath("/reports/procurement", launchpad?.roles);
  const { data, isLoading } = useQuery({
    queryKey: ["procurement-overview"],
    queryFn: () => fetchOverview(),
    enabled: allowed,
  });

  const totalSpend = data?.trend.reduce((sum, point) => sum + point.spend, 0) ?? 0;
  const totalSavings = data?.trend.reduce((sum, point) => sum + point.savings, 0) ?? 0;

  return (
    <ReportShell
      title="Procurement Overview"
      description="Spend, savings and supplier concentration across the last 12 months."
      providerMode={data?.providerMode}
    >
      {!rolesLoading && !allowed ? (
        <AccessDenied area="this report" />
      ) : isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-md lg:col-span-2" />
          <Skeleton className="h-80 rounded-md" />
          <Skeleton className="h-80 rounded-md" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-4 sm:grid-cols-3 lg:col-span-2">
            <Panel title="Total spend">
              <p className="tabular text-3xl font-light text-primary">{money(totalSpend)}</p>
              <p className="mt-1 text-xs text-muted-foreground">EUR, rolling 12 months</p>
            </Panel>
            <Panel title="Realised savings">
              <p className="tabular text-3xl font-light text-success">{money(totalSavings)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {totalSpend ? ((totalSavings / totalSpend) * 100).toFixed(1) : "0"}% of spend
              </p>
            </Panel>
            <Panel title="Active suppliers">
              <p className="tabular text-3xl font-light text-foreground">{data?.suppliers.length ?? 0}</p>
              <p className="mt-1 text-xs text-muted-foreground">Top suppliers by spend</p>
            </Panel>
          </div>

          <Panel title="Spend vs. savings trend" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data?.trend ?? []}>
                <defs>
                  <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <YAxis tickFormatter={money} tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <Tooltip
                  formatter={(value: number) => money(value)}
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="spend"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#spendFill)"
                />
                <Area
                  type="monotone"
                  dataKey="savings"
                  stroke="var(--color-success)"
                  strokeWidth={2}
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Spend by category">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.categories ?? []}
                  dataKey="spend"
                  nameKey="category"
                  innerRadius={62}
                  outerRadius={104}
                  paddingAngle={2}
                >
                  {(data?.categories ?? []).map((entry, index) => (
                    <Cell key={entry.category} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => money(value)}
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <ul className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
              {(data?.categories ?? []).map((entry, index) => (
                <li key={entry.category} className="flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: PIE_COLORS[index % PIE_COLORS.length] }}
                  />
                  {entry.category}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Top suppliers by spend">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.suppliers ?? []} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tickFormatter={money} tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <YAxis
                  type="category"
                  dataKey="supplier"
                  width={130}
                  tick={{ fontSize: 12 }}
                  stroke="var(--color-muted-foreground)"
                />
                <Tooltip
                  formatter={(value: number) => money(value)}
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="spend" fill="var(--color-primary)" radius={[0, 3, 3, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      )}
    </ReportShell>
  );
}
