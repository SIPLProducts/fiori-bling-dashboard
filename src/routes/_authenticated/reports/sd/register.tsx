import { createFileRoute } from "@tanstack/react-router";
import { ReportShell, AccessDenied } from "@/components/report-shell";
import { SdComingSoon } from "@/components/sd-coming-soon";
import { SD_REPORTS, canAccessSdReport } from "@/lib/sd-reports";
import { useLaunchpad } from "@/lib/use-launchpad";

const DEF = SD_REPORTS.find((r) => r.key === "register")!;

export const Route = createFileRoute("/_authenticated/reports/sd/register")({
  head: () => {
    const title = `${DEF.title} (${DEF.tcode}) — Nexus`;
    return {
      meta: [
        { title },
        { name: "description", content: DEF.description },
        { property: "og:title", content: title },
        { property: "og:description", content: DEF.description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: SalesRegisterPage,
});

function SalesRegisterPage() {
  const { data: launchpad, isLoading } = useLaunchpad();
  const allowed = canAccessSdReport("register", launchpad?.screens);

  return (
    <ReportShell title={DEF.title} description={DEF.description}>
      {!isLoading && !allowed ? <AccessDenied area={DEF.title} /> : <SdComingSoon def={DEF} />}
    </ReportShell>
  );
}
