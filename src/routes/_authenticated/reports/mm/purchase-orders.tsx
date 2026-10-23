import { createFileRoute } from "@tanstack/react-router";
import { ModuleComingSoon } from "@/components/module-coming-soon";
import { AccessDenied, ReportShell } from "@/components/report-shell";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";

export const Route = createFileRoute("/_authenticated/reports/mm/purchase-orders")({
  head: () => ({ meta: [
    { title: "Purchase Orders — HBL MIS Portal" },
    { name: "description", content: "Purchase module Purchase Orders reporting." },
    { property: "og:title", content: "Purchase Orders — HBL MIS Portal" },
    { property: "og:description", content: "Purchase module Purchase Orders reporting." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});

function Page() {
  const { data, isLoading } = useLaunchpad();
  const allowed = data?.isSuperAdmin || hasScreen(data?.screens, "mm.purchase-orders");
  return <ReportShell title="Purchase Orders" description="Purchase">
    {!isLoading && !allowed ? <AccessDenied area="Purchase Orders" /> : <ModuleComingSoon title="Purchase Orders" />}
  </ReportShell>;
}
