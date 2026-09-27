import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { AccessDenied, Panel, ReportShell } from "@/components/report-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLaunchpad } from "@/lib/use-launchpad";
import { hasScreen } from "@/lib/screens";
import { listZtbnColumns, listZtbnRows, type ZtbnColumn } from "@/lib/ztbn";

export const Route = createFileRoute("/_authenticated/reports/fi/tbn/table")({
  head: () => ({
    meta: [
      { title: "Full ZTBN Table — Financial Accounting" },
      { name: "description", content: "Complete ZTBN trial-balance values by GL and profit centre." },
      { property: "og:title", content: "Full ZTBN Table — Financial Accounting" },
      { property: "og:description", content: "Complete ZTBN trial-balance values by GL and profit centre." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TbnReport,
});

const PAGE_SIZE = 25;

function formatCell(value: string | number | null, column: ZtbnColumn): string {
  if (value === null || value === "") return "—";
  if (column.data_type === "numeric" && typeof value === "number") {
    return value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  }
  return String(value);
}

function TbnReport() {
  const { data: launchpad, isLoading: accessLoading } = useLaunchpad();
  const allowed = launchpad?.isSuperAdmin || hasScreen(launchpad?.screens, "fi.tbn");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const columnsQuery = useQuery({
    queryKey: ["ztbn-columns"],
    queryFn: listZtbnColumns,
    enabled: Boolean(allowed),
    staleTime: 5 * 60_000,
  });
  const rowsQuery = useQuery({
    queryKey: ["ztbn-rows", page, search],
    queryFn: () => listZtbnRows({ page, pageSize: PAGE_SIZE, search }),
    enabled: Boolean(allowed),
    placeholderData: keepPreviousData,
  });

  if (accessLoading) {
    return <ReportShell title="TBN" description="Loading trial balance…"><Skeleton className="h-96 w-full" /></ReportShell>;
  }
  if (!allowed) {
    return <ReportShell title="TBN" description="ZTBN trial balance"><AccessDenied area="TBN" /></ReportShell>;
  }

  const columns = columnsQuery.data ?? [];
  const rows = rowsQuery.data?.rows ?? [];
  const count = rowsQuery.data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const firstRow = count === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastRow = Math.min(page * PAGE_SIZE, count);
  const loading = columnsQuery.isLoading || rowsQuery.isLoading;
  const failed = columnsQuery.error ?? rowsQuery.error;

  return (
    <ReportShell title="TBN" description="Complete ZTBN trial balance by GL and profit centre" tcode="ZTBN">
      <Panel
        title="ZTBN values"
        actions={<span className="text-xs text-muted-foreground">{count.toLocaleString("en-IN")} records · {columns.length.toLocaleString("en-IN")} columns</span>}
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search GL code or description"
              className="pl-9"
              aria-label="Search TBN values"
            />
          </div>
          <p className="text-xs text-muted-foreground">Rows {firstRow.toLocaleString("en-IN")}–{lastRow.toLocaleString("en-IN")} of {count.toLocaleString("en-IN")}</p>
        </div>

        {failed ? (
          <p className="py-10 text-center text-sm text-destructive">Unable to load TBN values. Please refresh.</p>
        ) : loading ? (
          <Skeleton className="h-[480px] w-full" />
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No matching ZTBN records.</p>
        ) : (
          <div className="max-w-full overflow-x-auto rounded-md border border-border">
            <table className="min-w-max border-collapse text-xs">
              <thead className="sticky top-0 z-20 bg-muted">
                <tr>
                  {columns.map((column, index) => (
                    <th
                      key={column.field_name}
                      className={`h-11 min-w-32 whitespace-nowrap border-b border-r border-border px-3 text-left font-semibold text-foreground ${index < 2 ? "sticky z-30 bg-muted" : ""} ${index === 0 ? "left-0" : index === 1 ? "left-32" : ""}`}
                    >
                      {column.ui_label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-b-0 hover:bg-muted/40">
                    {columns.map((column, index) => (
                      <td
                        key={column.field_name}
                        className={`h-10 max-w-72 whitespace-nowrap border-r border-border px-3 tabular-nums text-card-foreground ${index < 2 ? "sticky z-10 bg-card" : ""} ${index === 0 ? "left-0" : index === 1 ? "left-32" : ""}`}
                        title={formatCell(row[column.field_name] ?? null, column)}
                      >
                        <span className="block max-w-64 truncate">{formatCell(row[column.field_name] ?? null, column)}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1 || rowsQuery.isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))} aria-label="Previous TBN page">
            <ChevronLeft className="size-4" /> Previous
          </Button>
          <span className="min-w-24 text-center text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages || rowsQuery.isFetching} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} aria-label="Next TBN page">
            Next <ChevronRight className="size-4" />
          </Button>
        </div>
      </Panel>
    </ReportShell>
  );
}