import { createFileRoute } from "@tanstack/react-router";
import { ModuleComingSoon } from "@/components/module-coming-soon";
import { AccessDenied, ReportShell } from "@/components/report-shell";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";

export const Route = createFileRoute("/_authenticated/reports/sd/dispatches")({
  head: () => ({ meta: [
    { title: "Dispatches — HBL MIS Portal" },
    { name: "description", content: "Sales and Distribution dispatch reporting." },
    { property: "og:title", content: "Dispatches — HBL MIS Portal" },
    { property: "og:description", content: "Sales and Distribution dispatch reporting." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: DispatchesPage,
});

function DispatchesPage() {
  const { data, isLoading } = useLaunchpad();
  const allowed = data?.isSuperAdmin || hasScreen(data?.screens, "sd.dispatches");
  return <ReportShell title="Dispatches" description="Sales & Distribution">
    {!isLoading && !allowed ? <AccessDenied area="Dispatches" /> : <ModuleComingSoon title="Dispatches" />}
  </ReportShell>;
}