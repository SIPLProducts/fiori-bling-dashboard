import { createFileRoute } from "@tanstack/react-router";
import { AccessDenied, ReportShell } from "@/components/report-shell";
import { SalesRegisterFilters } from "@/components/sales-register-filters";
import { SalesRegisterDashboard } from "@/components/sales-register-dashboard";
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

function SalesRegisterPage() {
  const { data, isLoading } = useLaunchpad();
  const allowed = data?.isSuperAdmin || hasScreen(data?.screens, "sd.dispatches");
  return <ReportShell title="Sales Register" description="Sales & Distribution">
    {!isLoading && !allowed ? <AccessDenied area="Sales Register" /> : <div className="space-y-4">
      <SalesRegisterFilters defaultOpen={false} />
      <SalesRegisterDashboard />
    </div>}
  </ReportShell>;
}
