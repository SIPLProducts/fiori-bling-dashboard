import { SoAgeingDashboard } from "@/components/so-ageing-dashboard";
import { soAgeingQuery, ageLastSync } from "@/lib/so-ageing-data";
import { lastSyncedLabel } from "@/lib/report-sync-time";
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

export const Route = createFileRoute("/_authenticated/reports/inv/inventory-aging")({
  head: () => ({ meta: [
    { title: "Inventory Aging — HBL MIS Portal" },
    { name: "description", content: "Inventory: stock ageing by bucket, plant, storage location and material." },
    { property: "og:title", content: "Inventory Aging — HBL MIS Portal" },
    { property: "og:description", content: "Inventory: stock ageing by bucket, plant, storage location and material." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});

function Page() {
  const { data, isLoading } = useLaunchpad();
  const allowed = data?.isSuperAdmin || hasScreen(data?.screens, "inv.inventory-aging");
  const qc = useQueryClient();
  const stock = useQuery({ ...soAgeingQuery, enabled: !!allowed });
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const pdf = async () => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 300));
    try { await exportDashboardPdf(ref.current, datedFileName("Inventory Aging", "pdf"), "[data-pdf-exclude]", { blockSelector: "[data-pdf-block]", headerSelector: "[data-pdf-header]", footerText: "HBL Confidential — Internal Use Only", preserveComputedChartColors: true }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "PDF failed"); }
    finally { setBusy(false); }
  };
  const dates = (stock.data ?? []).map((r) => r.keyDate).filter(Boolean).sort();
  const dm = (d: string) => d.split("-").reverse().join("-");
  const actions = <>
    {dates.length ? <span data-pdf-exclude className="hidden h-7 items-center rounded-md border border-primary/30 bg-primary/10 px-2 text-[11px] text-primary sm:inline-flex"><span className="font-medium">Key date:</span>&nbsp;{dm(dates[dates.length - 1]!)}</span> : null}
    {stock.data ? <span data-pdf-exclude className="hidden text-[11px] text-muted-foreground md:inline">{lastSyncedLabel(ageLastSync(stock.data))}</span> : null}
    <Button type="button" variant="action" size="sm" className="h-7 text-xs" disabled={stock.isFetching} onClick={() => qc.invalidateQueries({ queryKey: soAgeingQuery.queryKey })}><RefreshCw className={`size-3.5 ${stock.isFetching ? "animate-spin" : ""}`} />Refresh</Button>
    <SyncNowButton endpointName="Inventory_Aging" label="Inventory Aging" />
    <Button type="button" variant="export" size="sm" className="h-7 text-xs" onClick={pdf} disabled={busy || !stock.data}><FileDown className="size-3.5" />PDF</Button>
  </>;
  return <ReportShell title="Inventory Aging" unitLabel="Val in Cr" compact actions={allowed ? actions : undefined}>
    {!isLoading && !allowed ? <AccessDenied area="Inventory Aging" /> : stock.error ? <p className="text-sm text-destructive">{(stock.error as Error).message}</p> : !stock.data ? <p className="text-sm text-muted-foreground">Loading ageing…</p> : <div ref={ref}>
      {busy ? <div data-pdf-header className="flex items-center justify-between gap-6 border-b border-border bg-card px-4 py-3"><div className="min-w-0"><img src={hblLogo} alt="HBL" className="h-10 w-auto object-contain" /><p className="mt-1 text-xs font-semibold text-card-foreground">HBL Engineering Limited</p></div><div className="text-right"><h1 className="text-lg font-bold text-card-foreground">Inventory Aging</h1><p className="text-[11px] font-medium text-muted-foreground">Val in Cr</p></div></div> : null}
      <SoAgeingDashboard rows={stock.data} /></div>}
  </ReportShell>;
}
