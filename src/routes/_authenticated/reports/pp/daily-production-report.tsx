import { createFileRoute } from "@tanstack/react-router";
import { ModuleComingSoon } from "@/components/module-coming-soon";
import { AccessDenied, ReportShell } from "@/components/report-shell";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";

export const Route = createFileRoute("/_authenticated/reports/pp/daily-production-report")({
  head: () => ({ meta: [
    { title: "Daily Production Report — HBL MIS Portal" },
    { name: "description", content: "Production Planning daily production report.." },
    { property: "og:title", content: "Daily Production Report — HBL MIS Portal" },
    { property: "og:description", content: "Production Planning daily production report.." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});

function Page() {
  const { data, isLoading } = useLaunchpad();
  const allowed = data?.isSuperAdmin || hasScreen(data?.screens, "pp.daily-production-report");
  return <ReportShell title="Daily Production Report" description="Production Planning">
    {!isLoading && !allowed ? <AccessDenied area="Daily Production Report" /> : <ModuleComingSoon title="Daily Production Report" />}
  </ReportShell>;
}
