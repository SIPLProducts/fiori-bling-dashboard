import { Link } from "@tanstack/react-router";
import { ChevronLeft, Maximize2 } from "lucide-react";
import { ShellBar } from "@/components/shell-bar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLaunchpad } from "@/lib/use-launchpad";
import { useState, type ReactNode } from "react";


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
  accent,
  expandable = false,
}: {
  title: string;
  children: ReactNode | ((fullscreen: boolean) => ReactNode);
  className?: string;
  actions?: ReactNode;
  /** 1-6 maps to the --kpi-* palette; adds a coloured left edge. */
  accent?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Shows a full-screen toggle in the header. */
  expandable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const render = (fullscreen: boolean) =>
    typeof children === "function" ? (children as (f: boolean) => ReactNode)(fullscreen) : children;

  return (
    <section
      className={`rounded-md border border-border bg-card p-4 shadow-tile ${accent ? "border-l-[3px]" : ""} ${className}`}
      style={accent ? { borderLeftColor: `var(--kpi-${accent})` } : undefined}
    >
      <div className="mb-4 flex items-start justify-between gap-2">
        <h2 className="text-sm font-medium text-card-foreground">{title}</h2>
        <div className="flex shrink-0 items-center gap-1">
          {actions}
          {expandable ? (
            <button
              type="button"
              aria-label={`View ${title} full screen`}
              title="Full screen"
              onClick={() => setOpen(true)}
              className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
            >
              <Maximize2 className="size-4" />
            </button>
          ) : null}
        </div>
      </div>
      {!open ? render(false) : <div className="py-10 text-center text-xs text-muted-foreground">Shown full screen</div>}

      {expandable ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="flex h-[90vh] max-w-[95vw] flex-col sm:max-w-[95vw]">
            <DialogHeader>
              <DialogTitle className="text-base font-medium">{title}</DialogTitle>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-auto">{open ? render(true) : null}</div>
          </DialogContent>
        </Dialog>
      ) : null}
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
