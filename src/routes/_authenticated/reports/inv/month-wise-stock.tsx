import hblLogo from "@/assets/hbl-logo.png";
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileDown, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AccessDenied, ReportShell } from "@/components/report-shell";
import { GlassLoadingPage } from "@/components/glass-loading-page";
import { MonthWiseStockDashboard } from "@/components/month-wise-stock-dashboard";
import { Button } from "@/components/ui/button";
import { exportDashboardPdf } from "@/lib/chart-export";
import { datedFileName } from "@/lib/format";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";
import { monthWiseStockQuery } from "@/lib/month-wise-stock-data";

export const Route = createFileRoute("/_authenticated/reports/inv/month-wise-stock")({
  head: () => ({ meta: [
    { title: "Month Wise Stock — HBL MIS Portal" },
    { name: "description", content: "Inventory: month-wise closing stock value by type, plant and group." },
    { property: "og:title", content: "Month Wise Stock — HBL MIS Portal" },
    { property: "og:description", content: "Inventory: month-wise closing stock value by type, plant and group." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pl = (p: string) => `${MON[Number(p.slice(5, 7)) - 1]}-${p.slice(0, 4)}`;

function Page() {
  const { data, isLoading } = useLaunchpad();
  const allowed = data?.isSuperAdmin || hasScreen(data?.screens, "inv.month-wise-stock");
  const q = useQuery({ ...monthWiseStockQuery, enabled: !!allowed });
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const pdf = async () => {
    setBusy(true); await new Promise((r) => setTimeout(r, 300));
    try { await exportDashboardPdf(ref.current, datedFileName("Month Wise Stock", "pdf"), "[data-pdf-exclude]", { headerSelector: "[data-pdf-header]", footerText: "HBL Confidential — Internal Use Only", preserveComputedChartColors: true }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "PDF failed"); } finally { setBusy(false); }
  };
  const ps = [...new Set((q.data ?? []).map((r) => r.period))].sort();
  const actions = <>
    <span className="text-xs text-muted-foreground"><span className="font-medium">Data available:</span> {ps.length ? `${pl(ps[0] ?? "")} – ${pl(ps[ps.length - 1] ?? "")}` : "No data"}</span>
    <Button type="button" variant="action" size="sm" className="h-7 text-xs" onClick={() => void q.refetch()} disabled={q.isFetching}><RefreshCw className={`size-3.5 ${q.isFetching ? "animate-spin" : ""}`} />Refresh</Button>
    <Button type="button" variant="export" size="sm" className="h-7 text-xs" onClick={pdf} disabled={busy}><FileDown className="size-3.5" />PDF</Button>
  </>;
  return <ReportShell title="Month Wise Stock" compact actions={allowed ? actions : undefined}>
    {!isLoading && !allowed ? <AccessDenied area="Month Wise Stock" /> : <div ref={ref}>{busy ? <div data-pdf-header className="flex items-center justify-between gap-6 border-b border-border bg-card px-4 py-3"><div><img src={hblLogo} alt="HBL" className="h-10 w-auto object-contain" /><p className="mt-1 text-xs font-semibold text-card-foreground">HBL Engineering Limited</p></div><h1 className="text-lg font-bold text-card-foreground">Month Wise Stock</h1></div> : null}
      {q.isError ? <p className="p-4 text-sm text-destructive">{(q.error as Error).message}</p> : q.isLoading ? <GlassLoadingPage /> : <MonthWiseStockDashboard rows={q.data ?? []} />}</div>}
  </ReportShell>;
}
