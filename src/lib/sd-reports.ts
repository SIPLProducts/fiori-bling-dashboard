/**
 * Sales Distribution Reports module — screen registry.
 * Shared by the shell bar dropdown, the launchpad, the screen permission
 * matrix and each report route so all stay in sync.
 */

export type SdReportPath =
  | "/reports/sd/kpi"
  | "/reports/sd/finance-gst"
  | "/reports/sd/register";

export type SdReportDef = {
  key: string;
  screen: string;
  to: SdReportPath;
  title: string;
  tcode: string;
  description: string;
};

export const SD_MODULE_TITLE = "Sales Distribution Reports";

export const SD_REPORTS: SdReportDef[] = [
  {
    key: "kpi",
    screen: "sdr.kpi",
    to: "/reports/sd/kpi",
    title: "Sales report KPI",
    tcode: "ZFISALES_MIS",
    description: "Sales KPIs by posting date, profit center and plant.",
  },
  {
    key: "finance-gst",
    screen: "sdr.finance-gst",
    to: "/reports/sd/finance-gst",
    title: "Sales report for Finance and GST",
    tcode: "ZVF05_FIN_N",
    description: "Finance and GST view of the sales register.",
  },
  {
    key: "register",
    screen: "sdr.register",
    to: "/reports/sd/register",
    title: "Sales Register report",
    tcode: "ZVF05_SAL",
    description: "Document-level sales register listing.",
  },
];

export function sdReportsForScreens(screens: readonly string[] | undefined): SdReportDef[] {
  const allowed = screens ?? [];
  return SD_REPORTS.filter((report) => allowed.includes(report.screen));
}

export function canAccessSdReport(key: string, screens: readonly string[] | undefined): boolean {
  const report = SD_REPORTS.find((item) => item.key === key);
  if (!report) return false;
  return (screens ?? []).includes(report.screen);
}
