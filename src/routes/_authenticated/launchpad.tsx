import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Boxes, CircleDollarSign, Factory, Radio } from "lucide-react";
import { ShellBar } from "@/components/shell-bar";
import { PlaceholderTile, TableStatusTile, TileCard } from "@/components/tile-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_HEADLINE, orderGroupsForRoles, primaryRole } from "@/lib/nav";
import { useLaunchpad } from "@/lib/use-launchpad";

export const Route = createFileRoute("/_authenticated/launchpad")({
  head: () => ({ meta: [
    { title: "SAP Enterprise Portal — Analytics Launchpad" },
    { name: "description", content: "Role-based SAP enterprise analytics, operational KPIs, and reports." },
    { property: "og:title", content: "SAP Enterprise Portal — Analytics Launchpad" },
    { property: "og:description", content: "Enterprise SAP analytics and reporting launchpad." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: Launchpad,
});

const SECTION_META: Record<string, { subtitle: string; icon: typeof Factory }> = {
  "sales-distribution": { subtitle: "Quarterly Realtime Tracking", icon: Boxes },
  "financial-accounting": { subtitle: "FI General Ledger & Cash Analysis", icon: CircleDollarSign },
  "production-planning": { subtitle: "PP Operations & Work Centre Status", icon: Factory },
  "tables-master": { subtitle: "SAP Schema & Dictionary Tables", icon: Boxes },
};

const SECTION_TITLES: Record<string, string> = {
  "sales-distribution": "Sales & Distribution",
  "financial-accounting": "Financial Accounting",
  "production-planning": "Production Planning",
  "tables-master": "Tables Master",
};

function SectionHeading({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon: typeof Factory }) {
  return <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
    <div className="flex min-w-0 items-center gap-2"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></span><h2 className="truncate text-[11px] font-bold tracking-wide text-foreground uppercase">{title}</h2></div>
    <p className="hidden text-[10px] text-muted-foreground sm:block">{subtitle}</p>
  </div>;
}

function Launchpad() {
  const { data, isLoading, error } = useLaunchpad();
  const [activeGroup, setActiveGroup] = useState("all");
  const groups = useMemo(() => data ? orderGroupsForRoles(data.groups.filter((group) => data.tiles.some((tile) => tile.group_key === group.key)), data.roles) : [], [data]);
  const role = primaryRole(data?.roles);
  const visibleGroups = activeGroup === "all" ? groups : groups.filter((group) => group.key === activeGroup);

  return <div className="min-h-screen bg-background">
    <ShellBar launchpad title="Home" displayName={data?.profile?.display_name} screens={data?.screens} />
    <div className="border-b border-shell-foreground/10 bg-shell shadow-sm">
      <div className="mx-auto flex max-w-[1500px] gap-1 overflow-x-auto px-3 py-1.5" role="tablist" aria-label="Launchpad modules">
        {[{ key: "all", title: "All Modules" }, ...groups].map((group) => <button key={group.key} type="button" role="tab" aria-selected={activeGroup === group.key} onClick={() => setActiveGroup(group.key)} className={`min-h-7 shrink-0 rounded-full px-4 text-[10px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-shell-foreground focus-visible:outline-none ${activeGroup === group.key ? "bg-shell-foreground text-shell shadow-sm" : "text-shell-muted hover:bg-shell-foreground/10 hover:text-shell-foreground"}`}>{group.title}</button>)}
      </div>
    </div>

    <main className="mx-auto max-w-[1500px] px-3 py-4 sm:px-5">
      {error ? <p className="text-sm text-destructive">Could not load your launchpad. Please refresh.</p> : null}
      {role ? <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3 shadow-launchpad-tile">
        <div className="flex min-w-0 items-center gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><BadgeCheck className="size-[18px]" /></span><div className="min-w-0"><span className="text-[10px] font-bold tracking-wide text-primary uppercase">{role}</span><p className="truncate text-[11px] text-muted-foreground">{ROLE_HEADLINE[role]}</p></div></div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-[10px] font-semibold text-success"><Radio className="size-3" />Live Session Active</span>
      </div> : null}

      {data && data.roles.length === 0 ? <div className="mb-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">Your account has no role assigned yet. Ask an administrator to grant you access.</div> : null}
      {data && data.roles.length > 0 && !isLoading && data.tiles.length === 0 ? <div className="mb-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">Your role has no screens assigned yet. Ask an administrator to grant screen access.</div> : null}

      {isLoading ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-[188px] rounded-2xl" />)}</div> : visibleGroups.map((group) => {
        const groupTiles = data?.tiles.filter((tile) => tile.group_key === group.key) ?? [];
        if (!groupTiles.length) return null;
        const meta = SECTION_META[group.key] ?? { subtitle: "SAP Operational Analytics", icon: Boxes };
        return <section key={group.key} className="mb-7">
          <SectionHeading title={SECTION_TITLES[group.key] ?? group.title} subtitle={meta.subtitle} icon={meta.icon} />
          {group.key === "sales-distribution" ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {groupTiles.map((tile) => <TileCard key={tile.id} tile={tile} {...(data?.kpis[tile.kpi_key ?? ""] ? { kpi: data.kpis[tile.kpi_key ?? ""] } : {})} />)}
          </div> : group.key === "tables-master" ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <PlaceholderTile type="kna1" /><PlaceholderTile type="mara" /><PlaceholderTile type="lfa1" /><PlaceholderTile type="t001w" />
            {groupTiles.slice(0, 1).map((tile) => <TableStatusTile key={tile.id} title="ZFISALES_DETAIL" value="Sync Active" note="Latest SAP sales snapshot" {...(tile.target_path ? { href: tile.target_path } : {})} />)}
          </div> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <TableStatusTile title={group.key === "financial-accounting" ? "FI Overview" : "PP Overview"} value="Live" note={group.key === "financial-accounting" ? "Financial overview" : "Production overview"} href={group.key === "financial-accounting" ? "/reports/module/fi" : "/reports/module/pp"} action="Open overview" icon={group.key === "financial-accounting" ? CircleDollarSign : Factory} />
            {groupTiles.filter((tile) => tile.kind !== "launch").map((tile) => <TileCard key={tile.id} tile={tile} {...(data?.kpis[tile.kpi_key ?? ""] ? { kpi: data.kpis[tile.kpi_key ?? ""] } : {})} />)}
          </div>}
        </section>;
      })}
      {data ? <p className="mt-7 text-[10px] text-muted-foreground">Data source: {data.providerMode === "mock" ? "sample data (SAP not connected)" : "SAP OData"}</p> : null}
    </main>
  </div>;
}