import { createFileRoute } from "@tanstack/react-router";
import { ModuleComingSoon } from "@/components/module-coming-soon";
import { AccessDenied, ReportShell } from "@/components/report-shell";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";

export const Route = createFileRoute("/_authenticated/reports/inv/current-stock")({
  head: () => ({ meta: [
    { title: "Current Stock — HBL MIS Portal" },
    { name: "description", content: "Inventory: Current stock on hand by plant and material." },
    { property: "og:title", content: "Current Stock — HBL MIS Portal" },
    { property: "og:description", content: "Inventory: Current stock on hand by plant and material." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});

function Page() {
  const { data, isLoading } = useLaunchpad();
  const allowed = data?.isSuperAdmin || hasScreen(data?.screens, "inv.current-stock");
  return <ReportShell title="Current Stock" description="Inventory">
    {!isLoading && !allowed ? <AccessDenied area="Current Stock" /> : <ModuleComingSoon title="Current Stock" />}
  </ReportShell>;
}
