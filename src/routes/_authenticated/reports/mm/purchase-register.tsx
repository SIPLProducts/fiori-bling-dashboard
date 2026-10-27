import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { AccessDenied, ReportShell } from "@/components/report-shell";
import { PurchaseRegisterDashboard } from "@/components/purchase-register-dashboard";
import { Button } from "@/components/ui/button";
import { SyncNowButton } from "@/components/sync-now-button";
import { exportDashboardPdf } from "@/lib/chart-export";
import { datedFileName } from "@/lib/format";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { purchaseRegisterQuery } from "@/lib/purchase-register-data";

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
  const q = useQuery({ ...purchaseRegisterQuery, enabled: !!allowed });
  const rows = q.data ?? [];
  const dates = rows.map((r) => r.date).filter(Boolean).sort();
  const dmy = (d?: string) => d ? `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}` : "-";
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const pdf = async () => {
    setBusy(true);
    try { await exportDashboardPdf(ref.current, datedFileName("Purchase Register", "pdf")); }
    catch (e) { toast.error(e instanceof Error ? e.message : "PDF failed"); }
    finally { setBusy(false); }
  };
  const actions = <>
    <span className="text-xs text-muted-foreground"><span className="font-medium">Data available:</span> {dates.length ? `${dmy(dates[0])} – ${dmy(dates[dates.length - 1])}` : "No data"}</span>
    <Button type="button" variant="action" size="sm" className="h-7 text-xs" onClick={() => q.refetch()} disabled={q.isFetching}><RefreshCw className={`size-3.5 ${q.isFetching ? "animate-spin" : ""}`} />Refresh</Button>
    <SyncNowButton endpointName="Purchase Register" label="Purchase Register" />
    <Button type="button" variant="export" size="sm" className="h-7 text-xs" onClick={pdf} disabled={busy}><FileDown className="size-3.5" />PDF</Button>
  </>;
  return <ReportShell title="Purchase Register" compact actions={allowed ? actions : undefined}>
    {!isLoading && !allowed ? <AccessDenied area="Purchase Register" /> : <div ref={ref}>{q.isError ? <p className="p-4 text-sm text-destructive">{(q.error as Error).message}</p> : q.isLoading ? <p className="p-4 text-sm text-muted-foreground">Loading purchase data…</p> : <PurchaseRegisterDashboard rows={rows} />}</div>}
  </ReportShell>;
}
