import hblLogo from "@/assets/hbl-logo.png";
import { SyncNowButton } from "@/components/sync-now-button";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileDown, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AccessDenied, ReportShell } from "@/components/report-shell";
import { SalesRegisterFilters } from "@/components/sales-register-filters";
import { SalesRegisterDashboard } from "@/components/sales-register-dashboard";
import { Button } from "@/components/ui/button";
import { exportDashboardPdf } from "@/lib/chart-export";
import { datedFileName } from "@/lib/format";
import { buildSalesRegister, emptySalesRegisterFilters, filterSalesRegister, type SalesRegisterFilterState } from "@/lib/sales-register";
import { salesRegisterQuery } from "@/lib/sales-register-data";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";

export const Route = createFileRoute("/_authenticated/reports/sd/dispatches")({
  head: () => ({ meta: [
    { title: "Dispatches — HBL MIS Portal" },
    { name: "description", content: "Sales and Distribution sales register reporting." },
    { property: "og:title", content: "Dispatches — HBL MIS Portal" },
    { property: "og:description", content: "Sales and Distribution sales register reporting." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: SalesRegisterPage,
});

const dmy = (iso: string) => iso.split("-").reverse().join(".");

function SalesRegisterPage() {
  const { data, isLoading } = useLaunchpad();
  const allowed = data?.isSuperAdmin || hasScreen(data?.screens, "sd.dispatches");
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const query = useQuery({ ...salesRegisterQuery, enabled: Boolean(allowed) });
  const all = query.data ?? [];
  const [filters, setFilters] = useState<SalesRegisterFilterState>(emptySalesRegisterFilters);
  const rows = useMemo(() => filterSalesRegister(all, filters), [all, filters]);
  const range = buildSalesRegister(all).dateRange;
  const pdf = async () => {
    setBusy(true);
    try { await exportDashboardPdf(ref.current, datedFileName("Dispatches", "pdf"), "[data-pdf-exclude]", { headerSelector: "[data-pdf-header]", blockSelector: "[data-pdf-block]", footerText: "HBL Confidential — Internal Use Only", preserveComputedChartColors: true }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "PDF failed"); }
    finally { setBusy(false); }
  };
  const actions = <>
    <span className="text-xs text-muted-foreground"><span className="font-medium">Data available:</span> {range ? `${dmy(range.from)} – ${dmy(range.to)}` : "—"}</span>
    <Button type="button" variant="action" size="sm" className="h-7 text-xs" onClick={() => void query.refetch()} disabled={query.isFetching}><RefreshCw className={`size-3.5 ${query.isFetching ? "animate-spin" : ""}`} />Refresh</Button>
    <SyncNowButton endpointName="Sales _Register" label="Dispatches" className="h-7 text-xs" onSynced={() => query.refetch()} />
    <Button type="button" variant="export" size="sm" className="h-7 text-xs" onClick={pdf} disabled={busy}><FileDown className="size-3.5" />PDF</Button>
  </>;
  return <ReportShell title="Dispatches" compact actions={allowed ? actions : undefined}>
    {!isLoading && !allowed ? <AccessDenied area="Dispatches" /> : <div ref={ref} className="space-y-3">
      {busy ? <div data-pdf-header className="flex items-center justify-between gap-6 border-b border-border bg-card px-4 py-3"><div className="min-w-0"><img src={hblLogo} alt="HBL" className="h-10 w-auto object-contain" /><p className="mt-1 text-xs font-semibold text-card-foreground">HBL Engineering Limited</p></div><div className="text-right"><h1 className="text-lg font-bold text-card-foreground">Dispatches</h1><p className="text-[11px] font-medium text-muted-foreground">Val in Cr</p></div></div> : null}
      {query.error ? <p className="text-xs text-destructive">{query.error.message}</p> : null}
      <div data-pdf-exclude><SalesRegisterFilters defaultOpen={false} rows={all} value={filters} onChange={setFilters} /></div>
      <SalesRegisterDashboard rows={rows} range={filters.dates.billingDate} />
    </div>}
  </ReportShell>;
}
