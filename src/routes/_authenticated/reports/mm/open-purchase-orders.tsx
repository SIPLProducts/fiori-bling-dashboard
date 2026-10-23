import { createFileRoute } from "@tanstack/react-router";
import { ModuleComingSoon } from "@/components/module-coming-soon";
import { AccessDenied, ReportShell } from "@/components/report-shell";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";

export const Route = createFileRoute("/_authenticated/reports/mm/open-purchase-orders")({
  head: () => ({ meta: [
    { title: "Open Purchase Orders — HBL MIS Portal" },
    { name: "description", content: "Purchase module Open Purchase Orders reporting." },
    { property: "og:title", content: "Open Purchase Orders — HBL MIS Portal" },
    { property: "og:description", content: "Purchase module Open Purchase Orders reporting." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});

function Page() {
  const { data, isLoading } = useLaunchpad();
  const allowed = data?.isSuperAdmin || hasScreen(data?.screens, "mm.open-purchase-orders");
  return <ReportShell title="Open Purchase Orders" description="Purchase">
    {!isLoading && !allowed ? <AccessDenied area="Open Purchase Orders" /> : <ModuleComingSoon title="Open Purchase Orders" />}
  </ReportShell>;
}
