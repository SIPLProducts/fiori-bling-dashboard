import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { AccessDenied, ReportShell } from "@/components/report-shell";
import { SalesRegisterFilters } from "@/components/sales-register-filters";
import { SalesRegisterDashboard } from "@/components/sales-register-dashboard";
import { Button } from "@/components/ui/button";
import { exportDashboardPdf } from "@/lib/chart-export";
import { datedFileName } from "@/lib/format";
import { buildSalesRegister, type SalesRegisterRow } from "@/lib/sales-register";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";

export const Route = createFileRoute("/_authenticated/reports/sd/dispatches")({
  head: () => ({ meta: [
    { title: "Sales Register — HBL MIS Portal" },
    { name: "description", content: "Sales and Distribution sales register reporting." },
    { property: "og:title", content: "Sales Register — HBL MIS Portal" },
    { property: "og:description", content: "Sales and Distribution sales register reporting." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: SalesRegisterPage,
});

const ROWS: SalesRegisterRow[] = [];
const dmy = (iso: string) => iso.split("-").reverse().join(".");

function SalesRegisterPage() {
  const { data, isLoading } = useLaunchpad();
  const allowed = data?.isSuperAdmin || hasScreen(data?.screens, "sd.dispatches");
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const range = buildSalesRegister(ROWS).dateRange;
  const pdf = async () => {
    setBusy(true);
    try { await exportDashboardPdf(ref.current, datedFileName("Sales Register", "pdf")); }
    catch (e) { toast.error(e instanceof Error ? e.message : "PDF failed"); }
    finally { setBusy(false); }
  };
  const actions = <>
    <span className="text-xs text-muted-foreground"><span className="font-medium">Data available:</span> {range ? `${dmy(range.from)} – ${dmy(range.to)}` : "—"}</span>
    <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={pdf} disabled={busy}><FileDown className="size-3.5" />PDF</Button>
  </>;
  return <ReportShell title="Sales Register" compact actions={allowed ? actions : undefined}>
    {!isLoading && !allowed ? <AccessDenied area="Sales Register" /> : <div ref={ref} className="space-y-3">
      <SalesRegisterFilters defaultOpen={false} />
      <SalesRegisterDashboard rows={ROWS} />
    </div>}
  </ReportShell>;
}
