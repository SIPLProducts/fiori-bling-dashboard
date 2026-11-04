import hblLogo from "@/assets/hbl-logo.png";
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { AccessDenied, ReportShell } from "@/components/report-shell";
import { GlassLoadingPage } from "@/components/glass-loading-page";
import { PurchaseRegisterDashboard } from "@/components/purchase-register-dashboard";
import { Button } from "@/components/ui/button";
import { SyncNowButton } from "@/components/sync-now-button";
import { exportDashboardPdf } from "@/lib/chart-export";
import { datedFileName } from "@/lib/format";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { currentFy, purchaseRegisterFyQuery, purchaseRegisterYearsQuery } from "@/lib/purchase-register-data";

export const Route = createFileRoute("/_authenticated/reports/mm/purchase-register")({
  head: () => ({ meta: [
    { title: "Purchase Register — HBL MIS Portal" },
    { name: "description", content: "Purchase module Purchase Register reporting." },
    { property: "og:title", content: "Purchase Register — HBL MIS Portal" },
    { property: "og:description", content: "Purchase module Purchase Register reporting." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});

function Page() {
  const { data, isLoading } = useLaunchpad();
  const allowed = data?.isSuperAdmin || hasScreen(data?.screens, "mm.purchase-register");
  const [fy, setFy] = useState(() => currentFy());
  const yq = useQuery({ ...purchaseRegisterYearsQuery, enabled: !!allowed });
  const q = useQuery({ ...purchaseRegisterFyQuery(fy), enabled: !!allowed });
  const pq = useQuery({ ...purchaseRegisterFyQuery(fy - 1), enabled: !!allowed && !!q.data && (yq.data ?? []).includes(fy - 1) });
  const rows = q.data ?? [];
  const refresh = () => { void q.refetch(); void yq.refetch(); if ((yq.data ?? []).includes(fy - 1)) void pq.refetch(); };
  const dates = rows.map((r) => r.date).filter(Boolean).sort();
  const dmy = (d?: string) => d ? `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}` : "-";
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const pdf = async () => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 300));
    try { await exportDashboardPdf(ref.current, datedFileName("Purchase Register", "pdf"), "[data-pdf-exclude]", { headerSelector: "[data-pdf-header]", footerText: "HBL Confidential — Internal Use Only", preserveComputedChartColors: true }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "PDF failed"); }
    finally { setBusy(false); }
  };
  const actions = <>
    <span className="text-xs text-muted-foreground"><span className="font-medium">Data available:</span> {dates.length ? `${dmy(dates[0])} – ${dmy(dates[dates.length - 1])}` : "No data"}</span>
    <Button type="button" variant="action" size="sm" className="h-7 text-xs" onClick={refresh} disabled={q.isFetching}><RefreshCw className={`size-3.5 ${q.isFetching ? "animate-spin" : ""}`} />Refresh</Button>
    <SyncNowButton endpointName="Purchase Register" label="Purchase Register" />
    <Button type="button" variant="export" size="sm" className="h-7 text-xs" onClick={pdf} disabled={busy}><FileDown className="size-3.5" />PDF</Button>
  </>;
  return <ReportShell title="Purchase Register" compact actions={allowed ? actions : undefined}>
    {!isLoading && !allowed ? <AccessDenied area="Purchase Register" /> : <div ref={ref}>{busy ? <div data-pdf-header className="flex items-center justify-between gap-6 border-b border-border bg-card px-4 py-3"><div className="min-w-0"><img src={hblLogo} alt="HBL" className="h-10 w-auto object-contain" /><p className="mt-1 text-xs font-semibold text-card-foreground">HBL Engineering Limited</p></div><h1 className="text-lg font-bold text-card-foreground">Purchase Register</h1></div> : null}{q.isError ? <p className="p-4 text-sm text-destructive">{(q.error as Error).message}</p> : q.isLoading ? <GlassLoadingPage /> : <PurchaseRegisterDashboard rows={rows} prevYearRows={pq.data ?? []} years={yq.data ?? [fy]} year={fy} onYear={setFy} />}</div>}
  </ReportShell>;
}
