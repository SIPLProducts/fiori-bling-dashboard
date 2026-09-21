import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ShellBar } from "@/components/shell-bar";
import { TileCard } from "@/components/tile-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLaunchpad } from "@/lib/use-launchpad";
import { ROLE_HEADLINE, orderGroupsForRoles, primaryRole } from "@/lib/nav";


export const Route = createFileRoute("/_authenticated/launchpad")({
  head: () => ({
    meta: [
      { title: "Launchpad — Nexus Procurement Analytics" },
      {
        name: "description",
        content: "Role-based launchpad of SAP procurement KPIs, reports and analytical tiles.",
      },
      { property: "og:title", content: "Launchpad — Nexus Procurement Analytics" },
      { property: "og:description", content: "Your SAP procurement tiles, KPIs and reports in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Launchpad,
});

function Launchpad() {
  const { data, isLoading, error } = useLaunchpad();
  const [activeGroup, setActiveGroup] = useState<string>("all");

  // Only show groups that actually contain tiles this role may see, ordered by role focus.
  const groups = useMemo(() => {
    if (!data) return [];
    const withTiles = data.groups.filter((group) =>
      data.tiles.some((tile) => tile.group_key === group.key),
    );
    return orderGroupsForRoles(withTiles, data.roles);
  }, [data]);

  const tiles = useMemo(() => {
    if (!data) return [];
    if (activeGroup === "all") return data.tiles;
    return data.tiles.filter((tile) => tile.group_key === activeGroup);
  }, [data, activeGroup]);

  const role = primaryRole(data?.roles);

  return (
    <div className="min-h-screen bg-background">
      <ShellBar title="Home" displayName={data?.profile?.display_name} screens={data?.screens} />


      <div className="border-b border-primary/25 bg-shell shadow-sm">
        <div className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-4" role="tablist" aria-label="Launchpad modules">
          {[{ key: "all", title: "All" }, ...groups].map((group) => (
            <button
              key={group.key}
              type="button"
              role="tab"
              aria-selected={activeGroup === group.key}
              onClick={() => setActiveGroup(group.key)}
              className={`relative min-h-11 shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-shell-foreground focus-visible:ring-inset focus-visible:outline-none ${
                activeGroup === group.key
                  ? "border-shell-foreground bg-shell-foreground/14 text-shell-foreground shadow-[inset_0_-1px_0_var(--color-shell-foreground)]"
                  : "border-transparent text-shell-muted hover:bg-shell-foreground/8 hover:text-shell-foreground"
              }`}
            >
              {group.key === "all" ? "All Modules" : group.title}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-[1400px] px-4 py-6">
        {error ? (
          <p className="text-sm text-destructive">Could not load your launchpad. Please refresh.</p>
        ) : null}

        {data && data.roles.length === 0 ? (
          <div className="mb-6 rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
            Your account has no role assigned yet. Ask an administrator to grant you access.
          </div>
        ) : null}

        {data && data.roles.length > 0 && !isLoading && data.tiles.length === 0 ? (
          <div className="mb-6 rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
            Your role has no screens assigned yet — ask an administrator to grant screens in
            Administration → Screen Permissions.
          </div>
        ) : null}


        {role ? (
          <div className="mb-6 flex flex-wrap items-center gap-2 rounded-md border border-border/80 bg-card/70 px-4 py-3 shadow-sm">
            <span className="rounded-sm bg-primary/10 px-2 py-1 text-xs font-semibold tracking-wide text-primary uppercase">
              {role}
            </span>
            <span className="text-sm text-muted-foreground">{ROLE_HEADLINE[role]}</span>
          </div>
        ) : null}


        {isLoading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(212px,1fr))] gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-[152px] rounded-md" />
            ))}
          </div>
        ) : (
          <>
            {activeGroup === "all" ? (
              groups.map((group) => {
                const groupTiles = tiles.filter((tile) => tile.group_key === group.key);
                if (!groupTiles.length) return null;
                return (
                  <section key={group.key} className="mb-9">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="size-1.5 rounded-[2px] bg-primary" aria-hidden="true" />
                      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        {group.title}
                      </h2>
                      <span className="h-px flex-1 bg-border/70" aria-hidden="true" />
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
                      {groupTiles.map((tile) => (
                        <TileCard key={tile.id} tile={tile} kpi={data?.kpis[tile.kpi_key ?? ""]} />
                      ))}
                    </div>
                  </section>
                );
              })
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
                {tiles.map((tile) => (
                  <TileCard key={tile.id} tile={tile} kpi={data?.kpis[tile.kpi_key ?? ""]} />
                ))}
              </div>
            )}
          </>
        )}

        {data ? (
          <p className="mt-8 text-xs text-muted-foreground">
            Data source: {data.providerMode === "mock" ? "sample data (SAP not connected)" : "SAP OData"}
          </p>
        ) : null}
      </main>
    </div>
  );
}
