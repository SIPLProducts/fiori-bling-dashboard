import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { ShellBar } from "@/components/shell-bar";
import type { ReactNode } from "react";

export function ReportShell({
  title,
  description,
  providerMode,
  children,
}: {
  title: string;
  description: string;
  providerMode?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <ShellBar title={title} />
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-[1400px] px-4 py-4">
          <Link
            to="/launchpad"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
          >
            <ChevronLeft className="size-3.5" /> Launchpad
          </Link>
          <h1 className="mt-1 text-2xl font-light text-foreground">{title}</h1>
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
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-md border border-border bg-card p-4 shadow-tile ${className}`}>
      <h2 className="mb-4 text-sm font-medium text-card-foreground">{title}</h2>
      {children}
    </section>
  );
}
