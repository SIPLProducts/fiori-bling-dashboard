import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPurchaseOrderReport } from "@/lib/sap.functions";
import { Panel, ReportShell } from "@/components/report-shell";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/reports/purchase-orders")({
  validateSearch: (search: Record<string, unknown>) => ({
    focus: typeof search["focus"] === "string" ? (search["focus"] as string) : undefined,
  }),

  head: () => ({
    meta: [
      { title: "Purchase Order Items — Nexus Analytics" },
      {
        name: "description",
        content: "Searchable SAP purchase order item report with delivery dates, values and status.",
      },
      { property: "og:title", content: "Purchase Order Items — Nexus Analytics" },
      { property: "og:description", content: "Track SAP purchase order items, values, and delivery status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PurchaseOrderReport,
});


const STATUS_CLASS: Record<string, string> = {
  Open: "bg-primary/10 text-primary",
  Delivered: "bg-success/10 text-success",
  Overdue: "bg-destructive/10 text-destructive",
  Blocked: "bg-warning/15 text-warning-foreground",
};

function PurchaseOrderReport() {
  const fetchReport = useServerFn(getPurchaseOrderReport);
  const { data, isLoading } = useQuery({
    queryKey: ["po-items"],
    queryFn: () => fetchReport(),
  });
  const { focus } = Route.useSearch();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(focus ?? "all");


  const rows = useMemo(() => {
    const items = data?.items ?? [];
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesStatus = status === "all" || item.status === status;
      const matchesQuery =
        !needle ||
        [item.poNumber, item.supplier, item.material, item.category, item.plant]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      return matchesStatus && matchesQuery;
    });
  }, [data, query, status]);

  const statuses = ["all", "Open", "Delivered", "Overdue", "Blocked"];

  return (
    <ReportShell
      title="Purchase Order Items"
      description="Line-level purchase order detail from SAP with value, delivery date and status."
      providerMode={data?.providerMode}
    >
      <Panel title={`${rows.length} items`}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search PO, supplier, material, plant…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="max-w-xs"
          />
          <div className="flex gap-1">
            {statuses.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setStatus(option)}
                className={`rounded-sm border px-2.5 py-1.5 text-xs transition-colors ${
                  status === option
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {option === "all" ? "All" : option}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-96 rounded-md" />
        ) : (
          <div className="max-h-[620px] overflow-auto rounded-sm border border-border">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                <TableRow>
                  <TableHead>PO / Item</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Plant</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Net value</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((item) => (
                  <TableRow key={`${item.poNumber}-${item.item}`}>
                    <TableCell className="tabular font-medium">
                      {item.poNumber} / {item.item}
                    </TableCell>
                    <TableCell>{item.supplier}</TableCell>
                    <TableCell>
                      <div>{item.material}</div>
                      <div className="text-xs text-muted-foreground">{item.category}</div>
                    </TableCell>
                    <TableCell>{item.plant}</TableCell>
                    <TableCell className="tabular text-right">
                      {item.quantity} {item.unit}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {item.netValue.toLocaleString("en-US", { maximumFractionDigits: 0 })} {item.currency}
                    </TableCell>
                    <TableCell className="tabular">{item.deliveryDate}</TableCell>
                    <TableCell>
                      <span
                        className={`rounded-sm px-2 py-0.5 text-xs ${STATUS_CLASS[item.status] ?? "bg-muted"}`}
                      >
                        {item.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {!rows.length ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                      No purchase order items match your filters.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>
    </ReportShell>
  );
}
