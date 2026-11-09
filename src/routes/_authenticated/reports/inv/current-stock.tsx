import { CurrentStockDashboard } from "@/components/current-stock-dashboard";
import { currentStockQuery } from "@/lib/current-stock-data";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import hblLogo from "@/assets/hbl-logo.png";
import { useRef, useState } from "react";
import { FileDown, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { SyncNowButton } from "@/components/sync-now-button";
import { exportDashboardPdf } from "@/lib/chart-export";
import { datedFileName } from "@/lib/format";
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
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const pdf = async () => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 300));
    try { await exportDashboardPdf(ref.current, datedFileName("Current Stock", "pdf"), "[data-pdf-exclude]", { headerSelector: "[data-pdf-header]", footerText: "HBL Confidential — Internal Use Only", preserveComputedChartColors: true }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "PDF failed"); }
    finally { setBusy(false); }
  };
  const actions = <>
    <Button type="button" variant="action" size="sm" className="h-7 text-xs" disabled={stock.isFetching} onClick={() => qc.invalidateQueries({ queryKey: currentStockQuery.queryKey })}><RefreshCw className={`size-3.5 ${stock.isFetching ? "animate-spin" : ""}`} />Refresh</Button>
    <SyncNowButton endpointName="Current_Stock" label="Current Stock" />
    <Button type="button" variant="export" size="sm" className="h-7 text-xs" onClick={pdf} disabled={busy || !stock.data}><FileDown className="size-3.5" />PDF</Button>
  </>;
  return <ReportShell title="Current Stock" unitLabel="Val in Cr" compact actions={allowed ? actions : undefined}>
    {!isLoading && !allowed ? <AccessDenied area="Current Stock" /> : stock.error ? <p className="text-sm text-destructive">{(stock.error as Error).message}</p> : !stock.data ? <p className="text-sm text-muted-foreground">Loading stock…</p> : <div ref={ref}>
      {busy ? <div data-pdf-header className="flex items-center justify-between gap-6 border-b border-border bg-card px-4 py-3"><div className="min-w-0"><img src={hblLogo} alt="HBL" className="h-10 w-auto object-contain" /><p className="mt-1 text-xs font-semibold text-card-foreground">HBL Engineering Limited</p></div><div className="text-right"><h1 className="text-lg font-bold text-card-foreground">Current Stock</h1><p className="text-[11px] font-medium text-muted-foreground">Val in Cr</p></div></div> : null}
      <CurrentStockDashboard rows={stock.data.rows} sample={stock.data.sample} /></div>}
  </ReportShell>;
}
