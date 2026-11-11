import hblLogo from "@/assets/hbl-logo.png";
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileDown, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AccessDenied, ReportShell } from "@/components/report-shell";
import { GlassLoadingPage } from "@/components/glass-loading-page";
import { PurchaseOrdersDashboard } from "@/components/purchase-orders-dashboard";
import { Button } from "@/components/ui/button";
import { SyncNowButton } from "@/components/sync-now-button";
import { exportDashboardPdf } from "@/lib/chart-export";
import { datedFileName } from "@/lib/format";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";
import { purchaseOrdersQuery } from "@/lib/purchase-orders-data";

export const Route = createFileRoute("/_authenticated/reports/mm/purchase-orders")({
  head: () => ({ meta: [
    { title: "Purchase Orders — HBL MIS Portal" },
    { name: "description", content: "Purchase orders by type, vendor, plant and delivery status (ZME2N)." },
    { property: "og:title", content: "Purchase Orders — HBL MIS Portal" },
    { property: "og:description", content: "Purchase orders by type, vendor, plant and delivery status (ZME2N)." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});

function Page() {
  const { data, isLoading } = useLaunchpad();
  const allowed = data?.isSuperAdmin || hasScreen(data?.screens, "mm.purchase-orders");
  const q = useQuery({ ...purchaseOrdersQuery, enabled: !!allowed });
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const pdf = async () => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 300));
    try { await exportDashboardPdf(ref.current, datedFileName("Purchase Orders", "pdf"), "[data-pdf-exclude]", { headerSelector: "[data-pdf-header]", footerText: "HBL Confidential — Internal Use Only", preserveComputedChartColors: true }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "PDF failed"); }
    finally { setBusy(false); }
  };
  const dates = (q.data ?? []).map((r) => r.poDate).filter(Boolean).sort();
  const dmy = (d?: string) => d ? `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}` : "-";
  const actions = <>
    <span className="text-xs text-muted-foreground"><span className="font-medium">Data available:</span> {dates.length ? `${dmy(dates[0])} – ${dmy(dates[dates.length - 1])}` : "No data"}</span>
    <Button type="button" variant="action" size="sm" className="h-7 text-xs" onClick={() => void q.refetch()} disabled={q.isFetching}><RefreshCw className={`size-3.5 ${q.isFetching ? "animate-spin" : ""}`} />Refresh</Button>
    <SyncNowButton endpointName="Purchase_Orders" label="Purchase Orders" />
    <Button type="button" variant="export" size="sm" className="h-7 text-xs" onClick={pdf} disabled={busy}><FileDown className="size-3.5" />PDF</Button>
  </>;
  return <ReportShell title="Purchase Orders" unitLabel="Val in Cr" compact actions={allowed ? actions : undefined}>
    {!isLoading && !allowed ? <AccessDenied area="Purchase Orders" /> : <div ref={ref}>{busy ? <div data-pdf-header className="flex items-center justify-between gap-6 border-b border-border bg-card px-4 py-3"><div className="min-w-0"><img src={hblLogo} alt="HBL" className="h-10 w-auto object-contain" /><p className="mt-1 text-xs font-semibold text-card-foreground">HBL Engineering Limited</p></div><div className="text-right"><h1 className="text-lg font-bold text-card-foreground">Purchase Orders</h1><p className="text-[11px] font-medium text-muted-foreground">Val in Cr</p></div></div> : null}{q.isError ? <p className="p-4 text-sm text-destructive">{(q.error as Error).message}</p> : q.isLoading ? <GlassLoadingPage /> : <PurchaseOrdersDashboard rows={q.data ?? []} />}</div>}
  </ReportShell>;
}
