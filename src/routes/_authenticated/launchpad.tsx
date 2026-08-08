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
  const fetchLaunchpad = useServerFn(getLaunchpad);
  const { data, isLoading, error } = useQuery({
    queryKey: ["launchpad"],
    queryFn: () => fetchLaunchpad(),
  });
  const [activeGroup, setActiveGroup] = useState<string>("all");

  const groups = data?.groups ?? [];
  const tiles = useMemo(() => {
    if (!data) return [];
    if (activeGroup === "all") return data.tiles;
    return data.tiles.filter((tile) => tile.group_key === activeGroup);
  }, [data, activeGroup]);

  return (
    <div className="min-h-screen bg-background">
      <ShellBar title="Home" displayName={data?.profile?.display_name} roles={data?.roles} />

      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-4">
          {[{ key: "all", title: "All" }, ...groups].map((group) => (
            <button
              key={group.key}
              type="button"
              onClick={() => setActiveGroup(group.key)}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm transition-colors ${
                activeGroup === group.key
                  ? "border-primary font-medium text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {group.title}
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
                  <section key={group.key} className="mb-8">
                    <h2 className="mb-3 text-sm font-medium tracking-wide text-muted-foreground uppercase">
                      {group.title}
                    </h2>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(212px,1fr))] gap-4">
                      {groupTiles.map((tile) => (
                        <TileCard key={tile.id} tile={tile} kpi={data?.kpis[tile.kpi_key ?? ""]} />
                      ))}
                    </div>
                  </section>
                );
              })
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(212px,1fr))] gap-4">
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
