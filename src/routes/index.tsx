import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, LayoutGrid, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nexus — SAP Procurement Analytics Portal" },
      {
        name: "description",
        content:
          "A Fiori-inspired analytics portal for SAP procurement: launchpad tiles, spend dashboards, purchase order and supplier reports.",
      },
      { property: "og:title", content: "Nexus — SAP Procurement Analytics Portal" },
      {
        property: "og:description",
        content: "Launchpad tiles, spend dashboards and supplier scorecards on top of your SAP data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: LayoutGrid,
    title: "Familiar launchpad",
    body: "Grouped tiles, KPI numbers and micro-charts — the layout your SAP users already navigate by muscle memory.",
  },
  {
    icon: BarChart3,
    title: "Analytical reports",
    body: "Spend trends, category splits, purchase order line detail and supplier scorecards, drillable from any tile.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    body: "Admin, buyer, approver and viewer roles decide which tiles and reports each customer sees.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-14 items-center justify-between bg-shell px-4 text-shell-foreground">
        <span className="rounded-sm bg-primary px-2 py-1 text-[13px] font-bold tracking-[0.18em] text-primary-foreground">
          NEXUS
        </span>
        <Link
          to="/auth"
          className="rounded-sm border border-shell-foreground/30 px-3 py-1.5 text-sm transition-colors hover:bg-shell-foreground/10"
        >
          Sign in
        </Link>
      </header>

      <main>
        <section className="mx-auto max-w-[1100px] px-4 py-20 text-center">
          <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
            SAP procurement analytics
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl leading-tight font-light text-foreground sm:text-5xl">
            The launchpad your customers know, with the reporting they've been asking for.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground">
            Nexus reads your SAP procurement data through OData services and presents it as a
            Fiori-style launchpad: grouped tiles, live KPIs and drill-down analytics for spend,
            purchase orders and suppliers.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              to="/auth"
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Open the portal
            </Link>
          </div>
        </section>

        <section className="border-t border-border bg-card">
          <div className="mx-auto grid max-w-[1100px] gap-6 px-4 py-14 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title}>
                <feature.icon className="size-6 text-primary" strokeWidth={1.5} />
                <h2 className="mt-3 text-base font-medium text-card-foreground">{feature.title}</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Nexus Analytics Portal · SAP-connected procurement reporting
      </footer>
    </div>
  );
}
