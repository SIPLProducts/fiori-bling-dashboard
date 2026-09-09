import { useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import { ReportShell, Panel } from "@/components/report-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadCsv } from "@/lib/chart-export";
import { applySdFilters, fetchSdLines, type SdFilters, type SdLine } from "@/lib/sd-live";

const PAGE_SIZE = 50;
const strings = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

export const Route = createFileRoute("/_authenticated/reports/sd/drilldown")({
  validateSearch: (search: Record<string, unknown>) => ({
    month: typeof search.month === "string" ? search.month : "",
    customer: typeof search.customer === "string" ? search.customer : "",
    from: typeof search.from === "string" ? search.from : "",
    to: typeof search.to === "string" ? search.to : "",
    salesType: typeof search.salesType === "string" ? search.salesType : "",
    segments: strings(search.segments),
    profitCentres: strings(search.profitCentres),
    plants: strings(search.plants),
    q: typeof search.q === "string" ? search.q : "",
    page: Number.isFinite(Number(search.page)) ? Math.max(1, Math.floor(Number(search.page))) : 1,
  }),
  head: () => ({
    meta: [
      { title: "Net Sales Drill-down — Posting Lines" },
      { name: "description", content: "Detailed SAP net sales posting lines by month and customer." },
      { property: "og:title", content: "Net Sales Drill-down — Posting Lines" },
      { property: "og:description", content: "Detailed SAP net sales posting lines by month and customer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NetSalesDrilldown,
  errorComponent: () => <p className="p-8 text-sm text-destructive">Unable to load posting lines.</p>,
});

const money = (value: number) =>
  value.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const number = (value: number) => value.toLocaleString("en-IN", { maximumFractionDigits: 2 });

function monthMatches(row: SdLine, month: string) {
  if (!month) return true;
  if (/^\d{4}-\d{2}$/.test(month)) return row.postingDate.startsWith(month);
  return row.month.toLowerCase() === month.toLowerCase();
}

function NetSalesDrilldown() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data, isLoading } = useQuery({ queryKey: ["sd-live-lines"], queryFn: fetchSdLines });

  const rows = useMemo(() => {
    const filters: SdFilters = {
      from: search.from,
      to: search.to,
      plants: search.plants,
      profitCentres: search.profitCentres,
      segments: search.segments,
      customers: search.customer ? [search.customer] : [],
      search: search.q,
    };
    let result = applySdFilters(data ?? [], filters).filter((row) => monthMatches(row, search.month));
    if (search.salesType) {
      result = result.filter((row) => row.salesType.toLowerCase() === search.salesType.toLowerCase());
    }
    return result;
  }, [data, search]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(search.page, pages);
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  const quantity = rows.reduce((sum, row) => sum + row.quantity, 0);
  const context = [search.month, search.customer, ...search.segments, ...search.profitCentres].filter(Boolean);

  const exportRows = () =>
    downloadCsv(
      rows.map((row) => ({
        "Posting date": row.postingDate,
        Month: row.month,
        "Document No": row.docNo,
        Item: row.docItem,
        "Customer code": row.customer,
        "Customer name": row.customerName,
        "Profit centre": row.pcShortName || row.profitCtrName || row.profitCtr,
        Material: row.material,
        "Material description": row.materialDesc,
        Quantity: row.quantity,
        Unit: row.unit,
        "Amount in local cur.": row.amount,
        "Sales type": row.salesType,
        Segment: row.businessSegment || row.segment,
        "Sales employee": row.salesRepName,
      })),
      "net-sales-posting-lines.csv",
    );

  return (
    <ReportShell title="Net Sales Drill-down" description="Detailed SAP posting lines">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/reports/module/$module" params={{ module: "sd" }}>
              <ChevronLeft /> Back to Net Sales
            </Link>
          </Button>
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              value={search.q}
              onChange={(event) => navigate({ search: (prev) => ({ ...prev, q: event.target.value, page: 1 }), replace: true })}
              className="pl-8"
              placeholder="Search document, customer or material"
              aria-label="Search posting lines"
            />
          </div>
        </div>

        {context.length ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Applied:</span>
            {context.map((value) => <span key={value} className="rounded-md border border-border bg-card px-2 py-1 text-foreground">{value}</span>)}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-border bg-card p-4 shadow-tile"><p className="text-xs text-muted-foreground">Posting lines</p><p className="mt-1 text-2xl font-semibold tabular">{rows.length.toLocaleString("en-IN")}</p></div>
          <div className="rounded-md border border-border bg-card p-4 shadow-tile"><p className="text-xs text-muted-foreground">Total sales</p><p className="mt-1 text-2xl font-semibold tabular">{money(total)}</p></div>
          <div className="rounded-md border border-border bg-card p-4 shadow-tile"><p className="text-xs text-muted-foreground">Total quantity</p><p className="mt-1 text-2xl font-semibold tabular">{number(quantity)}</p></div>
        </div>

        {isLoading ? <Skeleton className="h-[520px]" /> : (
          <Panel title={`Posting lines (${rows.length.toLocaleString("en-IN")})`} accent={1} actions={<Button variant="outline" size="sm" onClick={exportRows}><Download /> CSV</Button>}>
            <div className="max-h-[620px] overflow-auto rounded-md border border-border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10 bg-muted text-left text-[11px] uppercase text-muted-foreground">
                  <tr>{["Posting date", "Month", "Document / Item", "Customer", "Profit centre", "Material", "Quantity", "Amount in local cur.", "Sales type", "Segment", "Sales employee"].map((label) => <th key={label} className={`px-3 py-2.5 font-semibold whitespace-nowrap ${label === "Quantity" || label.startsWith("Amount") ? "text-right" : ""}`}>{label}</th>)}</tr>
                </thead>
                <tbody>
                  {visible.map((row, index) => (
                    <tr key={`${row.docNo}-${row.docItem}-${index}`} className="border-t border-border/60 odd:bg-muted/20 hover:bg-accent/40">
                      <td className="px-3 py-2 whitespace-nowrap">{row.postingDate || "—"}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{row.month || "—"}</td>
                      <td className="px-3 py-2 whitespace-nowrap font-medium">{row.docNo || "—"} / {row.docItem || "—"}</td>
                      <td className="max-w-64 px-3 py-2"><span className="block truncate" title={`${row.customerName || row.customer} (${row.customer})`}>{row.customerName || row.customer || "—"}</span></td>
                      <td className="max-w-52 px-3 py-2"><span className="block truncate" title={row.pcShortName || row.profitCtrName || row.profitCtr}>{row.pcShortName || row.profitCtrName || row.profitCtr || "—"}</span></td>
                      <td className="max-w-64 px-3 py-2"><span className="block truncate" title={`${row.material} · ${row.materialDesc}`}>{row.materialDesc || row.material || "—"}</span></td>
                      <td className="px-3 py-2 text-right tabular whitespace-nowrap">{number(row.quantity)} {row.unit}</td>
                      <td className={`px-3 py-2 text-right font-medium tabular whitespace-nowrap ${row.amount < 0 ? "text-destructive" : ""}`}>{money(row.amount)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{row.salesType || "—"}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{row.businessSegment || row.segment || "—"}</td>
                      <td className="max-w-52 px-3 py-2"><span className="block truncate" title={row.salesRepName}>{row.salesRepName || "—"}</span></td>
                    </tr>
                  ))}
                  {!visible.length ? <tr><td colSpan={11} className="px-4 py-16 text-center text-sm text-muted-foreground">No posting lines match this selection.</td></tr> : null}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>Showing {visible.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{(page - 1) * PAGE_SIZE + visible.length} of {rows.length.toLocaleString("en-IN")}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} aria-label="Previous page" onClick={() => navigate({ search: (prev) => ({ ...prev, page: page - 1 }) })}><ChevronLeft /></Button>
                <span className="tabular">Page {page} / {pages}</span>
                <Button variant="outline" size="sm" disabled={page >= pages} aria-label="Next page" onClick={() => navigate({ search: (prev) => ({ ...prev, page: page + 1 }) })}><ChevronRight /></Button>
              </div>
            </div>
          </Panel>
        )}
      </div>
    </ReportShell>
  );
}