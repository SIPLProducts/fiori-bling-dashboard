import { Link } from "@tanstack/react-router";
import { FileSpreadsheet, PlugZap } from "lucide-react";
import type { SdReportDef } from "@/lib/sd-reports";

/** Placeholder body for a Sales Distribution report that is not wired to SAP yet. */
export function SdComingSoon({ def }: { def: SdReportDef }) {
  return (
    <section className="rounded-md border border-border bg-card p-10 text-center shadow-tile">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
        <FileSpreadsheet className="size-6" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-medium text-card-foreground">{def.title}</h2>
      <span className="mt-2 inline-flex items-center gap-1 rounded-sm bg-muted px-2 py-1 font-mono text-xs tracking-wide text-muted-foreground">
        {def.tcode}
      </span>
      <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
        Report coming soon — this screen will be wired to <span className="font-medium">{def.tcode}</span>{" "}
        through the SAP middleware. Navigation and permissions are already in place.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Link
          to="/reports/sd/kpi"
          className="inline-flex items-center gap-1 rounded-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
        >
          Open Sales report KPI
        </Link>
        <Link
          to="/admin/sap-api"
          className="inline-flex items-center gap-1 rounded-sm border border-border px-3 py-2 text-sm text-foreground hover:bg-muted"
        >
          <PlugZap className="size-4" aria-hidden="true" /> SAP API Settings
        </Link>
      </div>
    </section>
  );
}
