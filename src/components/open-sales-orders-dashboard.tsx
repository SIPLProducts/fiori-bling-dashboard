import { useEffect, useId, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import {
  Box,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  FileText,
  FileSpreadsheet,
  Filter,
  IndianRupee,
  Package,
  RefreshCw,
  RotateCcw,
  Search,
  TriangleAlert,
  Truck,
} from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getOpenSalesOrders, type OpenSalesOrder } from "@/lib/open-sales-orders-data";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import hblLogo from "@/assets/hbl-logo.png";
import { exportDashboardPdf } from "@/lib/chart-export";
import { downloadOpenSalesOrdersExcel } from "@/lib/open-sales-orders-export";
import { MultiSelect, type MultiSelectOption } from "@/components/multi-select";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { displayOpenOrderDate, filterOpenOrderTable, openOrderStatusLabel, type OpenOrderTableStatus } from "@/lib/open-sales-orders-table";

const COLORS = ["var(--kpi-1)", "var(--kpi-5)", "var(--kpi-3)", "var(--kpi-4)", "var(--kpi-2)"];
const formatCr = (value: number) => `₹ ${value.toFixed(2)} Cr`;
const formatNumber = (value: number) => Math.round(value).toLocaleString("en-IN");
const DEFAULT_DOCUMENT_TYPES = ["ZDOR", "ZEOR", "ZSOR"];

type Filters = {
  documentTypes: string[];
  customers: string[] | null;
  zones: string[] | null;
  products: string[] | null;
  divisions: string[] | null;
};

const EMPTY_FILTERS: Filters = {
  documentTypes: DEFAULT_DOCUMENT_TYPES,
  customers: null,
  zones: null,
  products: null,
  divisions: null,
};

const productKey = (row: OpenSalesOrder) => `${row.material} — ${row.description}`;
const customerKey = (row: OpenSalesOrder) => row.customerSoldTo || row.customer;

type Tone = "primary" | "success" | "violet" | "warning";
const TONE_STYLES: Record<Tone, { card: string; icon: string }> = {
  primary: { card: "border-primary/25 bg-primary/15", icon: "bg-primary text-primary-foreground" },
  success: { card: "border-success/25 bg-success/15", icon: "bg-success text-success-foreground" },
  violet: { card: "border-chart-5/25 bg-chart-5/15", icon: "bg-chart-5 text-primary-foreground" },
  warning: { card: "border-warning/30 bg-warning/5", icon: "bg-warning text-warning-foreground" },
};

function Panel({ title, children, className = "", headerDivider = false, dividerColor = "neutral" }: { title: string; children: ReactNode; className?: string; headerDivider?: boolean; dividerColor?: "neutral" | "blue" | "green" | "violet" | "amber" | "teal" }) {
  return (
    <section className={`min-w-0 rounded-md border border-border bg-card p-4 shadow-tile order-panel ${className}`}>
      <h2 className={`mb-2 text-[15px] font-semibold text-card-foreground ${headerDivider ? `order-heading-divider order-heading-${dividerColor} border-b-2 pb-2` : ""}`}>{title}</h2>
      {children}
    </section>
  );
}

function chartGradients({ prefix, colors }: { prefix: string; colors: readonly string[] }) {
  return <defs>{colors.map((color, index) => <linearGradient key={index} id={`${prefix}-${index}`} x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor={`color-mix(in oklab, ${color} var(--order-gradient-light-share), var(--quick-view-value))`} />
    <stop offset="45%" stopColor={color} />
    <stop offset="100%" stopColor={`color-mix(in oklab, ${color} var(--order-gradient-deep-share), var(--foreground))`} />
  </linearGradient>)}</defs>;
}

function SummaryCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: ComponentType<{ className?: string }>; tone: Tone }) {
  const styles = TONE_STYLES[tone];
  return (
    <section className={`order-summary flex min-h-32 items-start gap-4 rounded-md border p-4 shadow-tile ${styles.card}`}>
      <span className={`grid size-12 shrink-0 place-items-center rounded-full ${styles.icon}`}><Icon className="size-6" /></span>
      <div className="min-w-0 pt-0.5">
        <p className="text-sm font-semibold text-card-foreground">{label}</p>
        <p className="mt-1 text-3xl font-semibold leading-none text-foreground tabular-nums">{value}</p>
      </div>
    </section>
  );
}

function percent(value: number, total: number) {
  return Math.round((value / Math.max(1, total)) * 100);
}

type RankedItem = { name: string; value: number; quantity: number; count: number };

function rankOrders(rows: OpenSalesOrder[], label: (row: OpenSalesOrder) => string): RankedItem[] {
  const grouped = new Map<string, RankedItem>();
  rows.forEach((row) => {
    const name = label(row) || "Unassigned";
    const current = grouped.get(name) ?? { name, value: 0, quantity: 0, count: 0 };
    current.value += row.value;
    current.quantity += row.openQuantity;
    current.count += 1;
    grouped.set(name, current);
  });
  return [...grouped.values()].sort((left, right) => right.value - left.value).slice(0, 10);
}

function StatusCard({ title, count, value, share, partial }: { title: string; count: number; value: number; share: number; partial?: boolean }) {
  return (
    <section className={`order-status flex min-h-28 items-center gap-4 rounded-md p-4 text-primary-foreground shadow-tile ${partial ? "bg-success" : "bg-primary"}`}>
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-card/20 ring-1 ring-card/35">
        {partial ? <Truck className="size-6" /> : <FileText className="size-6" />}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <div className="order-status-count mt-2">
          <p className="text-[10px] font-medium">Count</p>
          <p className="text-xl font-semibold leading-tight tabular-nums">{formatNumber(count)} <span className="text-xs font-normal">({share}%)</span></p>
        </div>
        <div className="mt-1">
          <p className="text-[10px] font-medium">Open Value (₹ Cr)</p>
          <p className="break-words text-base font-semibold leading-tight tabular-nums">{formatCr(value)}</p>
        </div>
      </div>
    </section>
  );
}

export function OpenSalesOrdersDashboard() {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const chartId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const documentGradient = `${chartId}-document`;
  const agingGradient = `${chartId}-aging`;
  const trendGradient = `${chartId}-trend`;
  const { data = [], error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["open-sales-orders-live"],
    queryFn: getOpenSalesOrders,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const documentTypeDefaultsInitialized = useRef(false);
  const [tablePage, setTablePage] = useState(1);
  const [tableStatus, setTableStatus] = useState<OpenOrderTableStatus>("all");
  const [tableSearch, setTableSearch] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [excelBusy, setExcelBusy] = useState(false);
  const tablePageSize = 10;
  const options = useMemo(() => ({
    documentType: [...new Set(data.map((row) => row.documentType))].sort(),
    customer: [...new Map(data.map((row) => [customerKey(row), { value: customerKey(row), label: row.customerSoldTo && row.customerSoldToName ? `${row.customerSoldTo} — ${row.customerSoldToName}` : row.customer }])).values()].sort((a, b) => a.label.localeCompare(b.label)),
    zone: [...new Set(data.map((row) => row.zone))].sort(),
    product: [...new Set(data.map(productKey))].sort(),
    division: [...new Map(data.map((row) => [row.division, { value: row.division, label: row.industryDescription ? `${row.division} — ${row.industryDescription}` : row.division }])).values()].sort((a, b) => a.value.localeCompare(b.value)),
  }), [data]);
  useEffect(() => {
    if (!data.length || documentTypeDefaultsInitialized.current) return;
    documentTypeDefaultsInitialized.current = true;
    setFilters((current) => ({
      ...current,
      documentTypes: current.documentTypes.filter((type) => options.documentType.includes(type)),
    }));
  }, [data.length, options.documentType]);
  const filteredData = useMemo(() => data.filter((row) => {
    if (dateRange?.from || dateRange?.to) {
      if (!row.orderDate || !Number.isFinite(Date.parse(row.orderDate))) return false;
      if (dateRange.from && row.orderDate < format(dateRange.from, "yyyy-MM-dd")) return false;
      if (dateRange.to && row.orderDate > format(dateRange.to, "yyyy-MM-dd")) return false;
    }
    if (!filters.documentTypes.includes(row.documentType)) return false;
    if (filters.customers !== null && !filters.customers.includes(customerKey(row))) return false;
    if (filters.zones !== null && !filters.zones.includes(row.zone)) return false;
    if (filters.products !== null && !filters.products.includes(productKey(row))) return false;
    if (filters.divisions !== null && !filters.divisions.includes(row.division)) return false;
    return true;
  }), [data, dateRange, filters]);
  const activeFilterCount = Number(Boolean(dateRange?.from))
    + Number(filters.documentTypes.length > 0)
    + [filters.customers, filters.zones, filters.products, filters.divisions].filter((values) => values !== null).length;
  useEffect(() => setTablePage(1), [dateRange, filters, tableStatus, tableSearch]);
  const resetFilters = () => {
    setDateRange(undefined);
    setFilters({
      ...EMPTY_FILTERS,
      documentTypes: DEFAULT_DOCUMENT_TYPES.filter((type) => options.documentType.includes(type)),
    });
  };
  const metrics = useMemo(() => {
    const totalValue = filteredData.reduce((sum, row) => sum + row.value, 0);
    const totalQuantity = filteredData.reduce((sum, row) => sum + row.openQuantity, 0);
    const buckets = [
      { name: "1 – 180 Days", rows: filteredData.filter((row) => row.daysOpen <= 180) },
      { name: "181 – 365 Days", rows: filteredData.filter((row) => row.daysOpen > 180 && row.daysOpen <= 365) },
      { name: "> 365 Days", rows: filteredData.filter((row) => row.daysOpen > 365) },
    ].map((bucket) => ({ ...bucket, count: bucket.rows.length, value: bucket.rows.reduce((sum, row) => sum + row.value, 0), partialValue: bucket.rows.filter((row) => row.deliveredQuantity > 0).reduce((sum, row) => sum + row.value, 0) }));
    const zoneMap = new Map<string, { name: string; count: number; quantity: number; value: number }>();
    filteredData.forEach((row) => {
      const name = row.zone.replace(" Zone", "");
      const current = zoneMap.get(name) ?? { name, count: 0, quantity: 0, value: 0 };
      current.count += 1;
      current.quantity += row.openQuantity;
      current.value += row.value;
      zoneMap.set(name, current);
    });
    const zones = [...zoneMap.values()].map((zone) => ({ ...zone, share: percent(zone.count, filteredData.length) })).sort((a, b) => b.count - a.count);
    const partialCount = filteredData.filter((row) => row.deliveredQuantity > 0).length;
    const statusValues = filteredData.reduce((totals, row) => {
      if (row.deliveredQuantity > 0) totals.partial += row.value;
      else totals.open += row.value;
      return totals;
    }, { open: 0, partial: 0 });
    const documentTypes = [...new Set(filteredData.map((row) => row.documentType))].sort().map((name) => {
      const rows = filteredData.filter((row) => row.documentType === name);
      return { name, count: rows.length, value: rows.reduce((sum, row) => sum + row.value, 0) };
    });
    return {
      totalValue,
      totalQuantity,
      buckets,
      zones,
      partialCount,
      partialOpenValue: statusValues.partial,
      notDeliveredOpenValue: statusValues.open,
      documentTypes,
      customers: rankOrders(filteredData, (row) => row.customer),
      products: rankOrders(filteredData, (row) => row.description),
      models: rankOrders(filteredData, (row) => row.model),
      notDeliveredCount: filteredData.length - partialCount,
      longest: [...filteredData].sort((a, b) => b.daysOpen - a.daysOpen)[0],
      highestValue: [...filteredData].sort((a, b) => b.value - a.value)[0],
      highestQuantity: [...filteredData].sort((a, b) => b.openQuantity - a.openQuantity)[0],
    };
  }, [filteredData]);
  const tableData = useMemo(() => filterOpenOrderTable(filteredData, tableStatus, tableSearch), [filteredData, tableStatus, tableSearch]);
  const tablePageCount = Math.max(1, Math.ceil(tableData.length / tablePageSize));
  const currentTablePage = Math.min(tablePage, tablePageCount);
  const tableRows = tableData.slice((currentTablePage - 1) * tablePageSize, currentTablePage * tablePageSize);
  const pdfDateLabel = dateRange?.from
    ? dateRange.to
      ? `${format(dateRange.from, "dd-MMM-yyyy")} – ${format(dateRange.to, "dd-MMM-yyyy")}`
      : format(dateRange.from, "dd-MMM-yyyy")
    : "All order dates";

  const downloadDashboardPdf = async () => {
    setPdfBusy(true);
    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      await exportDashboardPdf(dashboardRef.current, "open-sales-orders.pdf", "[data-pdf-exclude]", {
        headerSelector: "[data-pdf-header]",
        blockSelector: "[data-pdf-page-block]",
        sectionBreakSelector: "[data-pdf-section-break]",
        footerText: "HBL Confidential — Internal Use Only",
      });
      toast.success("Open Sales Orders PDF downloaded");
    } catch (downloadError) {
      toast.error(downloadError instanceof Error ? downloadError.message : "Unable to download the PDF");
    } finally {
      setPdfBusy(false);
    }
  };

  const downloadExcel = async () => {
    if (!tableData.length) {
      toast.error("No filtered orders to export");
      return;
    }
    setExcelBusy(true);
    try {
      await downloadOpenSalesOrdersExcel(tableData);
      toast.success("Open Sales Orders Excel downloaded");
    } catch (downloadError) {
      toast.error(downloadError instanceof Error ? downloadError.message : "Unable to download Excel");
    } finally {
      setExcelBusy(false);
    }
  };

  return (
    <div ref={dashboardRef} className={`mx-auto min-w-0 max-w-[1600px] space-y-4 pb-4 ${pdfBusy ? "pdf-export-theme" : "orders-compact"}`}>
      {pdfBusy ? <div data-pdf-header className="flex items-center justify-between gap-6 border-b border-border bg-card px-4 py-3">
        <div className="min-w-0"><img src={hblLogo} alt="HBL" className="h-10 w-auto object-contain" /><p className="mt-1 text-xs font-semibold text-card-foreground">HBL Engineering Limited</p></div>
        <p className="text-right text-xs font-semibold text-muted-foreground">{pdfDateLabel}</p>
      </div> : null}
      <header data-pdf-exclude className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-1">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-foreground">Open Sales Orders Reports</h1>
        </div>
        <div className="flex items-center gap-2"><Button type="button" variant="outline" size="sm" disabled={isFetching} onClick={async () => {
          const result = await refetch();
          if (result.error) toast.error(result.error.message);
          else toast.success("Open Sales Orders refreshed");
        }}><RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />{isFetching ? "Refreshing…" : "Refresh"}</Button><Button type="button" variant="outline" size="sm" disabled={pdfBusy || !filteredData.length} onClick={downloadDashboardPdf}><Download className="size-4" />{pdfBusy ? "Preparing…" : "PDF"}</Button></div>
      </header>

      {error ? <section className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error.message}</section> : null}
      {isLoading ? <section className="grid h-40 place-items-center rounded-md border border-border bg-card text-sm text-muted-foreground">Loading current Open Sales Orders…</section> : null}

      <section data-pdf-exclude className="rounded-md border border-border bg-card shadow-tile">
        <div className="flex min-h-11 items-center justify-between gap-3 px-4 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <Filter className="size-4 shrink-0 text-primary" />
            <h2 className="text-sm font-semibold text-card-foreground">Smart Filters</h2>
            {activeFilterCount > 0 ? <span className="rounded-sm border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{activeFilterCount} active</span> : null}
            <span className="hidden text-[10px] text-muted-foreground sm:inline">{formatNumber(filteredData.length)} of {formatNumber(data.length)} orders</span>
          </div>
          <div className="flex items-center gap-1">
            <Button type="button" variant="default" className="disabled:opacity-75" size="sm" onClick={resetFilters} disabled={activeFilterCount === 0}><RotateCcw className="size-3.5" />Reset</Button>
            <Button type="button" variant="ghost" size="icon" aria-label={filtersOpen ? "Collapse Smart Filters" : "Expand Smart Filters"} onClick={() => setFiltersOpen((open) => !open)}>{filtersOpen ? <ChevronUp /> : <ChevronDown />}</Button>
          </div>
        </div>
        {filtersOpen ? <div className="grid gap-3 border-t border-border p-4 sm:grid-cols-2 lg:grid-cols-6">
          <FilterField label="Date Range">
            <Popover>
              <PopoverTrigger asChild><Button variant="outline" className="h-9 w-full justify-start px-3 text-left text-xs font-normal"><CalendarDays className="size-3.5" /><span className="truncate">{dateRange?.from ? dateRange.to ? `${format(dateRange.from, "dd-MM-yyyy")} – ${format(dateRange.to, "dd-MM-yyyy")}` : format(dateRange.from, "dd-MM-yyyy") : "All dates"}</span></Button></PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start"><Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={1} className="pointer-events-auto p-3" /></PopoverContent>
            </Popover>
          </FilterField>
          <FilterMultiSelect label="Customer" selected={filters.customers} options={options.customer} onChange={(customers) => setFilters((current) => ({ ...current, customers }))} placeholder="All customers" />
          <FilterMultiSelect label="Sales Zone" selected={filters.zones} options={options.zone} onChange={(zones) => setFilters((current) => ({ ...current, zones }))} placeholder="All sales zones" />
          <FilterMultiSelect label="Products" selected={filters.products} options={options.product} onChange={(products) => setFilters((current) => ({ ...current, products }))} placeholder="All products" />
          <FilterMultiSelect label="Division" selected={filters.divisions} options={options.division} onChange={(divisions) => setFilters((current) => ({ ...current, divisions }))} placeholder="All divisions" />
          <FilterField label="Sales Document Type">
            <MultiSelect
              options={options.documentType.map((type) => ({ value: type, label: type }))}
              selected={filters.documentTypes}
              onChange={(documentTypes) => setFilters((current) => ({ ...current, documentTypes }))}
              placeholder="Select document types"
              bulkActions
            />
          </FilterField>
        </div> : null}
      </section>

      {pdfBusy ? <div data-pdf-page-block className="border-b border-border bg-card px-4 py-2">
        <h2 className="text-base font-semibold text-card-foreground">Open Sales Orders Reports</h2>
      </div> : null}

      <div data-pdf-page-block className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Total Open Orders" value={formatNumber(filteredData.length)} icon={FileText} tone="primary" />
        <SummaryCard label="Open Order Value" value={formatCr(metrics.totalValue)} icon={IndianRupee} tone="success" />
        <SummaryCard label="Open Quantity" value={formatNumber(metrics.totalQuantity)} icon={Package} tone="violet" />
      </div>

      <div data-pdf-page-block className="grid gap-4 lg:grid-cols-12 [&>*]:lg:col-span-4">
        <Panel title="Open Orders by Sales Document Type" headerDivider dividerColor="blue">
          <div className={pdfBusy ? "overflow-visible" : "min-w-0 overflow-x-auto"}>
          <div className="order-document-grid grid min-h-64 min-w-[380px] grid-cols-[128px_minmax(244px,1fr)] items-center gap-2">
            <div className="order-document-donut relative h-56 w-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%"><PieChart>{chartGradients({ prefix: documentGradient, colors: COLORS })}<Pie data={metrics.documentTypes} dataKey="count" nameKey="name" innerRadius="68%" outerRadius="90%" stroke="var(--card)" strokeWidth={1} isAnimationActive={false}>{metrics.documentTypes.map((item, index) => <Cell key={item.name} fill={`url(#${documentGradient}-${index})`} />)}</Pie><Tooltip formatter={(value: number) => [`${formatNumber(value)} orders`, "Orders"]} /></PieChart></ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-center"><strong className="text-xl font-bold leading-none text-card-foreground tabular-nums">{formatNumber(filteredData.length)}</strong><span className="text-[10px] font-semibold leading-tight text-card-foreground">Total Orders</span></div>
            </div>
            <div className="min-w-0 overflow-hidden rounded-md border border-border text-xs text-card-foreground">
              <div className="grid grid-cols-[minmax(0,1fr)_44px_68px_36px] items-center gap-1 bg-primary/5 px-2 py-2 text-[11px] font-semibold text-primary"><span className="min-w-0">Sales Document Type</span><span className="text-right">Orders</span><span className="text-right">Value (₹ Cr)</span><span className="text-right">%</span></div>
              {metrics.documentTypes.map((item, index) => <div key={item.name} className="grid grid-cols-[minmax(0,1fr)_44px_68px_36px] items-center gap-1 border-t border-border px-2 py-2"><span className="flex min-w-0 items-center gap-1.5 font-medium"><span className="size-2 shrink-0 rounded-full" style={{ background: COLORS[index] }} />{item.name}</span><span className="text-right tabular-nums">{formatNumber(item.count)}</span><span className="text-right tabular-nums">{item.value.toFixed(2)}</span><span className="text-right tabular-nums">{percent(item.count, filteredData.length)}%</span></div>)}
            </div>
          </div>
          </div>
        </Panel>
        <Panel title="Open Orders by Aging Bucket" headerDivider dividerColor="green">
          <div className="order-aging-grid grid min-h-64 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-3">
            <div className="relative h-56">
              <ResponsiveContainer width="100%" height="100%"><PieChart>{chartGradients({ prefix: agingGradient, colors: COLORS })}<Pie data={metrics.buckets} dataKey="count" nameKey="name" innerRadius="54%" outerRadius="82%" stroke="var(--card)" strokeWidth={1} isAnimationActive={false}>{metrics.buckets.map((bucket, index) => <Cell key={bucket.name} fill={`url(#${agingGradient}-${index})`} />)}</Pie><Tooltip formatter={(value: number) => [`${formatNumber(value)} orders`, "Orders"]} /></PieChart></ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-content-center text-center"><strong className="text-lg tabular-nums">{formatNumber(filteredData.length)}</strong><span className="text-xs text-muted-foreground">Orders</span></div>
            </div>
            <div className="divide-y divide-border">{metrics.buckets.map((bucket, index) => <div key={bucket.name} className="grid grid-cols-[10px_1fr_auto] items-center gap-2 py-3 text-xs"><span className="size-2.5 rounded-full" style={{ background: COLORS[index] }} /><span className="text-card-foreground">{bucket.name}</span><span className="text-right"><strong className="block tabular-nums">{formatNumber(bucket.count)}</strong><span className="text-primary">({percent(bucket.count, filteredData.length)}%)</span></span></div>)}</div>
          </div>
        </Panel>
        <Panel title="Open Order Value Trend" headerDivider dividerColor="amber">
          <ResponsiveContainer width="100%" height={pdfBusy ? 250 : 205}><BarChart data={metrics.buckets} barGap={4} margin={{ top: 22, right: 8, left: 0, bottom: 10 }}>{chartGradients({ prefix: trendGradient, colors: ["var(--kpi-1)", "var(--kpi-2)"] })}<CartesianGrid vertical={false} stroke="var(--chart-grid-line)" /><XAxis dataKey="name" interval={0} tick={{ fontSize: 10 }} tickFormatter={(value: string) => value.replace(" Days", "")} /><YAxis tick={{ fontSize: 10 }} label={{ value: "Value (₹ Cr)", angle: -90, position: "insideLeft", fontSize: 10 }} /><Tooltip formatter={(value: number, name: string) => [formatCr(value), name]} /><Legend wrapperStyle={{ fontSize: 10 }} payload={[{ value: "Open Orders", type: "square", color: "var(--kpi-1)" }, { value: "Partial Delivered", type: "square", color: "var(--kpi-2)" }]} /><Bar name="Open Orders" dataKey="value" fill={`url(#${trendGradient}-0)`} radius={[3, 3, 0, 0]} maxBarSize={42} isAnimationActive={false}><LabelList dataKey="value" position="top" formatter={(value: number) => value > 0 ? value.toFixed(1) : ""} className="fill-foreground text-[10px]" /></Bar><Bar name="Partial Delivered" dataKey="partialValue" fill={`url(#${trendGradient}-1)`} radius={[3, 3, 0, 0]} maxBarSize={42} isAnimationActive={false}><LabelList dataKey="partialValue" position="top" formatter={(value: number) => value > 0 ? value.toFixed(1) : ""} className="fill-foreground text-[10px]" /></Bar></BarChart></ResponsiveContainer>
        </Panel>
      </div>

      <div data-pdf-page-block className="grid gap-4" style={pdfBusy ? { width: Math.max(1280, metrics.zones.length * 48 + 120) } : undefined}>

        <Panel title="Open Order Lines by Sales Zone" headerDivider dividerColor="teal">
          <div className={pdfBusy ? "overflow-visible" : "overflow-x-auto"}>
            <div style={{ minWidth: Math.max(320, metrics.zones.length * 48 + 120) }}>
              <ResponsiveContainer width="100%" height={pdfBusy ? 380 : 290}>
                <BarChart data={metrics.zones} barCategoryGap={8} margin={{ top: 28, right: 20, left: 20, bottom: 12 }}>
                  <CartesianGrid vertical={false} stroke="var(--chart-grid-line)" />
                  <XAxis type="category" dataKey="name" interval={0} height={116} tick={<SalesZoneAxisTick />} tickLine={false} />
                  <YAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} tickFormatter={formatNumber} width={54} label={{ value: "Open Order Lines", angle: -90, position: "insideLeft", fontSize: 10 }} />
                  <Tooltip content={({ active, payload }) => active && payload?.[0]?.payload ? <SalesZoneTooltip item={payload[0].payload as ZoneItem} /> : null} />
                  <Bar dataKey="count" name="Open Order Lines" radius={[3, 3, 0, 0]} maxBarSize={32} isAnimationActive={false}>
                    {metrics.zones.map((zone, index) => <Cell key={zone.name} fill={COLORS[index % COLORS.length]} />)}
                    <LabelList dataKey="count" position="top" formatter={(value: number) => formatNumber(value)} className="fill-foreground text-[10px] font-semibold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Panel>
      </div>

      <div data-pdf-page-block data-pdf-section-break className="grid gap-4 lg:grid-cols-12 [&>*]:lg:col-span-4">
        <RankingPanel title="Top 10 Open Orders by Customer" data={metrics.customers} color="var(--chart-1)" />
        <RankingPanel title="Top 10 Open Orders by Product" data={metrics.products} color="var(--success)" />
        <RankingPanel title="Open Orders by Model Wise" data={metrics.models} color="var(--quick-view-violet)" />
      </div>

      <div data-pdf-page-block className="grid gap-4 lg:grid-cols-[0.65fr_0.75fr_2fr]">
        <StatusCard title="Open Orders" count={metrics.notDeliveredCount} value={metrics.notDeliveredOpenValue} share={percent(metrics.notDeliveredCount, filteredData.length)} />
        <StatusCard title="Partial Delivered Orders" count={metrics.partialCount} value={metrics.partialOpenValue} share={percent(metrics.partialCount, filteredData.length)} partial />
        <section className="min-w-0 overflow-hidden rounded-md border border-border">
          <h2 className="order-quick-header border-b border-border bg-quick-view-header px-4 py-3 text-sm font-semibold text-quick-view-heading">Quick View</h2>
          <div className="order-quick-body grid gap-3 p-2 sm:grid-cols-3">
            <QuickItem icon={CalendarDays} tone="primary" label="Longest Aging" value={`${formatNumber(metrics.longest?.daysOpen ?? 0)} Days`} detail={`Customer: ${metrics.longest?.customer ?? "—"}`} />
            <QuickItem icon={TriangleAlert} tone="warning" label="Highest Value" value={formatCr(metrics.highestValue?.value ?? 0)} detail={`Customer: ${metrics.highestValue?.customer ?? "—"}`} />
            <QuickItem icon={Box} tone="violet" label="Highest Quantity" value={formatNumber(metrics.highestQuantity?.openQuantity ?? 0)} detail={`Product: ${metrics.highestQuantity?.material ?? "—"}`} />
          </div>
        </section>
      </div>

      <section data-pdf-exclude className="overflow-hidden rounded-md border border-border bg-card shadow-tile">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div><h2 className="text-sm font-semibold text-card-foreground">Open Sales Orders Report – Detailed View (Aging Bucket)</h2><p className="text-[10px] text-muted-foreground">{formatNumber(tableData.length)} filtered orders</p></div>
          <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto">
            <div className="relative min-w-40 flex-1 xl:w-56"><Search aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search detailed orders" placeholder="Search orders…" value={tableSearch} onChange={(event) => setTableSearch(event.target.value)} className="h-9 pl-9" /></div>
            <Select value={tableStatus} onValueChange={(value) => { if (value === "all" || value === "open" || value === "partial") setTableStatus(value); }}><SelectTrigger aria-label="Filter orders by status" className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Status: All</SelectItem><SelectItem value="open">Open</SelectItem><SelectItem value="partial">Partially Delivered</SelectItem></SelectContent></Select>
            <Button data-pdf-exclude type="button" variant="outline" size="sm" disabled={excelBusy || !tableData.length} onClick={downloadExcel}><FileSpreadsheet className="size-4" />{excelBusy ? "Preparing…" : "Download Excel"}</Button>
          </div>
        </div>
        <Table>
          <TableHeader className="bg-primary/5"><TableRow>{["#", "Order No.", "Line Item", "Customer", "Sales Document Type", "Sales Zone", "Division", "Product", "Product Description", "Order Date", "Requested Date", "Days Open", "Open Qty", "Delivered Qty", "Open Value (₹ Cr)", "Status"].map((heading) => <TableHead key={heading} className="h-9 whitespace-nowrap text-[10px] font-semibold text-primary">{heading}</TableHead>)}</TableRow></TableHeader>
          <TableBody>{tableRows.length ? tableRows.map((row, index) => <TableRow key={`${row.order}:${row.item}`} data-document-type={row.documentType} className="order-detail-row text-[11px]"><TableCell>{(currentTablePage - 1) * tablePageSize + index + 1}</TableCell><TableCell className="whitespace-nowrap font-medium text-primary">{row.order}</TableCell><TableCell className="whitespace-nowrap">{row.item}</TableCell><TableCell className="whitespace-nowrap">{row.customer}</TableCell><TableCell className="order-document-cell font-medium"><span className="inline-flex items-center gap-1.5"><span className="order-document-dot size-2.5 shrink-0 rounded-sm" />{row.documentType}</span></TableCell><TableCell className="whitespace-nowrap">{row.zone.replace(" Zone", "")}</TableCell><TableCell>{row.division}</TableCell><TableCell className="whitespace-nowrap">{row.material}</TableCell><TableCell className="min-w-56">{row.description}</TableCell><TableCell className="whitespace-nowrap">{displayDate(row.orderDate)}</TableCell><TableCell className="whitespace-nowrap">{displayDate(row.deliveryDate)}</TableCell><TableCell className="text-right tabular-nums">{formatNumber(row.daysOpen)}</TableCell><TableCell className="text-right tabular-nums">{formatNumber(row.openQuantity)}</TableCell><TableCell className="text-right tabular-nums">{formatNumber(row.deliveredQuantity)}</TableCell><TableCell className="text-right tabular-nums">{row.value.toFixed(2)}</TableCell><TableCell><StatusBadge partial={row.deliveredQuantity > 0} /></TableCell></TableRow>) : <TableRow><TableCell colSpan={16} className="h-24 text-center text-muted-foreground">{isLoading ? "Loading current Open Sales Orders…" : "No open orders match the selected filters or search."}</TableCell></TableRow>}</TableBody>
        </Table>
        <div data-pdf-exclude className="flex flex-wrap items-center justify-start gap-2 border-t border-border px-4 py-3"><span className="mr-2 text-xs text-muted-foreground">Page {currentTablePage} of {tablePageCount}</span><Button variant="outline" size="sm" aria-label="Previous table page" disabled={currentTablePage <= 1} onClick={() => setTablePage(Math.max(1, currentTablePage - 1))}><ChevronLeft />Previous</Button><Button variant="outline" size="sm" aria-label="Next table page" disabled={currentTablePage >= tablePageCount} onClick={() => setTablePage(Math.min(tablePageCount, currentTablePage + 1))}>Next<ChevronRight /></Button></div>
      </section>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="min-w-0 space-y-1"><span className="block text-[10px] font-medium text-muted-foreground">{label}</span>{children}</label>;
}

function FilterMultiSelect({ label, selected, options, onChange }: { label: string; selected: string[] | null; options: string[] | MultiSelectOption[]; onChange: (value: string[]) => void; placeholder: string }) {
  const choices = options.map((option) => typeof option === "string" ? { value: option, label: option } : option);
  return <FilterField label={label}><MultiSelect bulkActions options={choices} selected={selected ?? choices.map((option) => option.value)} onChange={onChange} placeholder="No values selected" /></FilterField>;
}

function SalesZoneAxisTick({ x = 0, y = 0, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <text transform="translate(0,12) rotate(-45)" textAnchor="end" className="fill-muted-foreground text-[10px]">{payload?.value}</text>
    </g>
  );
}

function RankingPanel({ title, data, color }: { title: string; data: RankedItem[]; color: string }) {
  return <Panel title={title} className="order-ranking" headerDivider dividerColor={color === "var(--success)" ? "green" : color === "var(--quick-view-violet)" ? "violet" : "blue"}>{data.length ? <ResponsiveContainer width="100%" height={300}><BarChart data={data} layout="vertical" margin={{ top: 5, right: 52, left: 4, bottom: 5 }}><CartesianGrid horizontal={false} stroke="var(--chart-grid-line)" /><XAxis type="number" tick={{ fontSize: 10 }} /><YAxis type="category" dataKey="name" width={142} tick={<RankingAxisTick />} axisLine={false} tickLine={false} /><Tooltip formatter={(value: number, name: string, item) => name === "Open Value" ? [formatCr(value), name] : [value, name]} content={({ active, payload }) => active && payload?.[0]?.payload ? <RankingTooltip item={payload[0].payload as RankedItem} /> : null} /><Bar dataKey="value" name="Open Value" fill={color} radius={[0, 3, 3, 0]} isAnimationActive={false}><LabelList dataKey="value" position="right" formatter={(value: number) => value.toFixed(1)} className="fill-foreground text-[10px] font-semibold" /></Bar></BarChart></ResponsiveContainer> : <div className="grid h-[300px] place-items-center text-sm text-muted-foreground">No matching orders</div>}</Panel>;
}

function RankingAxisTick({ x = 0, y = 0, payload }: { x?: number; y?: number; payload?: { value?: string } }) {
  const label = payload?.value ?? "";
  return <g transform={`translate(${x},${y})`}><foreignObject x={-138} y={-10} width={132} height={20}><div className="truncate whitespace-nowrap text-right text-[10px] leading-5 text-muted-foreground" title={label}>{label}</div></foreignObject></g>;
}

function RankingTooltip({ item }: { item: RankedItem }) {
  return <div className="rounded-md border border-border bg-popover p-2 text-xs text-popover-foreground shadow-md"><p className="mb-1 font-semibold">{item.name}</p><p>Open Value: {formatCr(item.value)}</p><p>Open Quantity: {formatNumber(item.quantity)}</p><p>Orders: {formatNumber(item.count)}</p></div>;
}

type ZoneItem = { name: string; count: number; quantity: number; value: number; share: number };

function SalesZoneTooltip({ item }: { item: ZoneItem }) {
  return <div className="rounded-md border border-border bg-popover p-2 text-xs text-popover-foreground shadow-md"><p className="mb-1 font-semibold">Sales Zone: {item.name}</p><p>Open Order Lines: {formatNumber(item.count)}</p><p>Open Quantity: {formatNumber(item.quantity)}</p><p>Open Value: {formatCr(item.value)}</p></div>;
}

function StatusBadge({ partial }: { partial: boolean }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${partial ? "bg-warning/20 text-warning-foreground" : "bg-primary/10 text-primary"}`}>{openOrderStatusLabel(partial ? 1 : 0)}</span>;
}

function displayDate(value: string) {
  return displayOpenOrderDate(value);
}

function QuickItem({ icon: Icon, tone, label, value, detail }: { icon: ComponentType<{ className?: string }>; tone: "primary" | "warning" | "violet"; label: string; value: string; detail: string }) {
  const styles = {
    primary: { card: "border-primary bg-primary text-primary-foreground", icon: "bg-primary-foreground/15 text-primary-foreground" },
    warning: { card: "border-warning bg-warning text-quick-view-value", icon: "bg-quick-view-value/15 text-quick-view-value" },
    violet: { card: "border-quick-view-violet bg-quick-view-violet text-primary-foreground", icon: "bg-primary-foreground/15 text-primary-foreground" },
  }[tone];
  return <div className={`order-quick min-h-32 min-w-0 rounded-md border border-l-4 p-3 shadow-tile ${styles.card}`}>
    <h3 className="text-xs font-semibold">{label}</h3>
    <div className="mt-4 flex min-w-0 items-start gap-2">
      <span className={`grid size-8 shrink-0 place-items-center rounded-full ${styles.icon}`}><Icon className="size-4" /></span>
      <div className="min-w-0">
        <p className="order-quick-repeat text-[10px] font-medium">{label}</p>
        <p className="mt-0.5 break-words text-base font-semibold text-quick-view-value tabular-nums">{value}</p>
        <p className="mt-1 truncate text-[10px]" title={detail}>({detail})</p>
      </div>
    </div>
  </div>;
}