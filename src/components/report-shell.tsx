import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { ShellBar } from "@/components/shell-bar";
import { useLaunchpad } from "@/lib/use-launchpad";
import type { ReactNode } from "react";

export function ReportShell({
  title,
  description,
  tcode,
  providerMode,
  children,
}: {
  title: string;
  description: string;
  tcode?: string | undefined;
  providerMode?: string | undefined;
  children: ReactNode;
}) {
  const { data: launchpad } = useLaunchpad();
  return (
    <div className="min-h-screen bg-background">
      <ShellBar title={title} displayName={launchpad?.profile?.display_name} screens={launchpad?.screens} />

      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-[1400px] px-4 py-4">
          <Link
            to="/launchpad"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
          >
            <ChevronLeft className="size-3.5" /> Launchpad
          </Link>
          <h1 className="mt-1 text-2xl font-light text-foreground">{title}</h1>
          {tcode ? (
            <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
              {tcode}
            </p>
          ) : null}
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <main className="mx-auto max-w-[1400px] px-4 py-6">{children}</main>
      {providerMode ? (
        <p className="mx-auto max-w-[1400px] px-4 pb-8 text-xs text-muted-foreground">
          Data source: {providerMode === "mock" ? "sample data (SAP not connected)" : "SAP OData"}
        </p>
      ) : null}
    </div>
  );
}

export function Panel({
  title,
  children,
  className = "",
  actions,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <section className={`rounded-md border border-border bg-card p-4 shadow-tile ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <h2 className="text-sm font-medium text-card-foreground">{title}</h2>
        {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}


export function AccessDenied({ area }: { area: string }) {
  return (
    <section className="rounded-md border border-border bg-card p-8 text-center shadow-tile">
      <h2 className="text-lg font-medium text-card-foreground">Not authorised</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Your role does not include access to {area}. Ask a portal administrator to grant you the
        required role.
      </p>
      <Link
        to="/launchpad"
        className="mt-4 inline-flex items-center gap-1 rounded-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
      >
        Back to launchpad
      </Link>
    </section>
  );
}
