import { createFileRoute } from "@tanstack/react-router";
import { ModuleComingSoon } from "@/components/module-coming-soon";
import { AccessDenied, ReportShell } from "@/components/report-shell";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";

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
  return <ReportShell title="Purchase Register" description="Purchase">
    {!isLoading && !allowed ? <AccessDenied area="Purchase Register" /> : <ModuleComingSoon title="Purchase Register" />}
  </ReportShell>;
}
