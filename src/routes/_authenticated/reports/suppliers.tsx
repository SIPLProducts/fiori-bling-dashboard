import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { getSupplierReport } from "@/lib/sap.functions";
import { Panel, ReportShell, AccessDenied } from "@/components/report-shell";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/reports/suppliers")({
  head: () => ({
    meta: [
      { title: "Supplier Scorecards — Nexus Analytics" },
      {
        name: "description",
        content: "Supplier evaluation scorecards covering quality, delivery, price and on-time performance.",
      },
      { property: "og:title", content: "Supplier Scorecards — Nexus Analytics" },
      { property: "og:description", content: "Compare supplier quality, delivery and price performance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SupplierReport,
});

function scoreTone(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning-foreground";
  return "text-destructive";
}

function SupplierReport() {
  const fetchReport = useServerFn(getSupplierReport);
  const { data, isLoading } = useQuery({
    queryKey: ["supplier-scorecards"],
    queryFn: () => fetchReport(),
  });

  return (
    <ReportShell
      title="Supplier Scorecards"
      description="Evaluation results per supplier across quality, delivery and price dimensions."
      providerMode={data?.providerMode}
    >
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-72 rounded-md" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(data?.suppliers ?? []).map((supplier) => (
            <Panel key={supplier.supplier} title={supplier.supplier}>
              <div className="flex items-start justify-between">
                <div>
                  <p className={`tabular text-3xl font-light ${scoreTone(supplier.overall)}`}>
                    {supplier.overall}
                  </p>
                  <p className="text-xs text-muted-foreground">overall score · {supplier.country}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div className="tabular">
                    {supplier.spend.toLocaleString("en-US", { maximumFractionDigits: 0 })} EUR
                  </div>
                  <div>{supplier.openOrders} open orders</div>
                  <div>{supplier.onTimePct}% on time</div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={170}>
                <RadarChart
                  data={[
                    { axis: "Quality", value: supplier.quality },
                    { axis: "Delivery", value: supplier.delivery },
                    { axis: "Price", value: supplier.price },
                    { axis: "On time", value: supplier.onTimePct },
                  ]}
                >
                  <PolarGrid stroke="var(--color-border)" />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                  <Radar
                    dataKey="value"
                    stroke="var(--color-primary)"
                    fill="var(--color-primary)"
                    fillOpacity={0.25}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </Panel>
          ))}
        </div>
      )}
    </ReportShell>
  );
}
