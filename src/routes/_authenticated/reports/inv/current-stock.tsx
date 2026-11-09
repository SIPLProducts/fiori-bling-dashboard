import { CurrentStockDashboard } from "@/components/current-stock-dashboard";
import { currentStockQuery } from "@/lib/current-stock-data";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { AccessDenied, ReportShell } from "@/components/report-shell";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";

export const Route = createFileRoute("/_authenticated/reports/inv/current-stock")({
  head: () => ({ meta: [
    { title: "Current Stock — HBL MIS Portal" },
    { name: "description", content: "Inventory: Current stock on hand by plant and material." },
    { property: "og:title", content: "Current Stock — HBL MIS Portal" },
    { property: "og:description", content: "Inventory: Current stock on hand by plant and material." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});

function Page() {
  const { data, isLoading } = useLaunchpad();
  const allowed = data?.isSuperAdmin || hasScreen(data?.screens, "inv.current-stock");
  const qc = useQueryClient();
  const stock = useQuery({ ...currentStockQuery, enabled: !!allowed });
  return <ReportShell title="Current Stock" description="Val in LAH">
    {!isLoading && !allowed ? <AccessDenied area="Current Stock" /> : stock.error ? <p className="text-sm text-destructive">{(stock.error as Error).message}</p> : !stock.data ? <p className="text-sm text-muted-foreground">Loading stock…</p> : <>
      <div className="mb-2 flex justify-end"><Button size="sm" variant="outline" disabled={stock.isFetching} onClick={() => qc.invalidateQueries({ queryKey: currentStockQuery.queryKey })}>{stock.isFetching ? "Refreshing…" : "Refresh"}</Button></div>
      <CurrentStockDashboard rows={stock.data.rows} sample={stock.data.sample} /></>}
  </ReportShell>;
}
