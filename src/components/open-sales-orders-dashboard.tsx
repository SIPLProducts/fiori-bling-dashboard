import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import {
  Box,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock3,
  Download,
  FileText,
  FileSpreadsheet,
  Filter,
  IndianRupee,
  Package,
  RefreshCw,
  RotateCcw,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import hblLogo from "@/assets/hbl-logo.png";
import { exportDashboardPdf } from "@/lib/chart-export";
import { downloadOpenSalesOrdersExcel } from "@/lib/open-sales-orders-export";

const COLORS = ["var(--kpi-1)", "var(--kpi-5)", "var(--kpi-3)", "var(--kpi-4)", "var(--kpi-2)"];
const formatCr = (value: number) => `₹ ${value.toFixed(2)} Cr`;
const formatNumber = (value: number) => Math.round(value).toLocaleString("en-IN");
const ALL = "__all__";

type Filters = {
  documentType: string;
  customer: string;
  zone: string;
  salesType: string;
  product: string;
  division: string;
};

const EMPTY_FILTERS: Filters = {
  documentType: ALL,
  customer: ALL,
  zone: ALL,
  salesType: ALL,
  product: ALL,
  division: ALL,
};

const productKey = (row: OpenSalesOrder) => `${row.material} — ${row.description}`;

type Tone = "primary" | "success" | "violet" | "warning";
const TONE_STYLES: Record<Tone, { card: string; icon: string }> = {
  primary: { card: "border-primary/25 bg-primary/5", icon: "bg-primary text-primary-foreground" },
  success: { card: "border-success/25 bg-success/5", icon: "bg-success text-success-foreground" },
  violet: { card: "border-chart-5/25 bg-chart-5/5", icon: "bg-chart-5 text-primary-foreground" },
  warning: { card: "border-warning/30 bg-warning/5", icon: "bg-warning text-warning-foreground" },
};

function Panel({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-md border border-border bg-card p-4 shadow-tile ${className}`}>
      <h2 className="mb-2 text-[15px] font-semibold text-card-foreground">{title}</h2>
      {children}
    </section>
  );
}

function SummaryCard({ label, value, delta, icon: Icon, tone, lowerIsBetter = false }: { label: string; value: string; delta: number; icon: ComponentType<{ className?: string }>; tone: Tone; lowerIsBetter?: boolean }) {
  const positive = lowerIsBetter ? delta <= 0 : delta >= 0;
  const styles = TONE_STYLES[tone];
  return (
    <section className={`flex min-h-32 items-start gap-4 rounded-md border p-4 shadow-tile ${styles.card}`}>
      <span className={`grid size-12 shrink-0 place-items-center rounded-full ${styles.icon}`}><Icon className="size-6" /></span>
      <div className="min-w-0 pt-0.5">
        <p className="text-sm font-semibold text-card-foreground">{label}</p>
        <p className="mt-1 text-3xl font-semibold leading-none text-foreground tabular-nums">{value}</p>
        <p className={`mt-3 text-xs font-semibold ${positive ? "text-success" : "text-destructive"}`}>
          {delta >= 0 ? "▲" : "▼"} {delta >= 0 ? "+" : ""}{delta.toFixed(0)}%
        </p>
        <p className="text-[10px] text-muted-foreground">vs. last period</p>
      </div>
    </section>
  );
}

function percent(value: number, total: number) {
  return Math.round((value / Math.max(1, total)) * 100);
}

function periodChange(rows: OpenSalesOrder[], value: (row: OpenSalesOrder) => number) {
    const ordered = [...rows].sort((a, b) => a.orderDate.localeCompare(b.orderDate));
  const midpoint = Math.floor(ordered.length / 2);
  const previous = ordered.slice(0, midpoint).reduce((sum, row) => sum + value(row), 0);
  const current = ordered.slice(midpoint).reduce((sum, row) => sum + value(row), 0);
  return previous ? ((current - previous) / previous) * 100 : 0;
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

function StatusCard({ title, count, share, partial }: { title: string; count: number; share: number; partial?: boolean }) {
  return (
    <section className={`flex min-h-28 items-center gap-4 rounded-md p-4 text-primary-foreground shadow-tile ${partial ? "bg-success" : "bg-primary"}`}>
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-card/20 ring-1 ring-card/35">
        {partial ? <Truck className="size-6" /> : <FileText className="size-6" />}
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums">{formatNumber(count)}</p>
        <p className="text-sm">({share}%)</p>
      </div>
    </section>
  );
}

export function OpenSalesOrdersDashboard() {
  const dashboardRef = useRef<HTMLDivElement>(null);
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
  const [tablePage, setTablePage] = useState(1);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [excelBusy, setExcelBusy] = useState(false);
  const tablePageSize = 10;
  const options = useMemo(() => ({
    documentType: [...new Set(data.map((row) => row.documentType))].sort(),
    customer: [...new Set(data.map((row) => row.customer))].sort(),
    zone: [...new Set(data.map((row) => row.zone))].sort(),
    salesType: [...new Set(data.map((row) => row.salesType))].sort(),
    product: [...new Set(data.map(productKey))].sort(),
    division: [...new Set(data.map((row) => row.division))].sort(),
  }), [data]);
  const filteredData = useMemo(() => data.filter((row) => {
    const rowDate = new Date(`${row.orderDate}T00:00:00`);
    if (dateRange?.from && rowDate < dateRange.from) return false;
    if (dateRange?.to && rowDate > dateRange.to) return false;
    if (filters.documentType !== ALL && row.documentType !== filters.documentType) return false;
    if (filters.customer !== ALL && row.customer !== filters.customer) return false;
    if (filters.zone !== ALL && row.zone !== filters.zone) return false;
    if (filters.salesType !== ALL && row.salesType !== filters.salesType) return false;
    if (filters.product !== ALL && productKey(row) !== filters.product) return false;
    if (filters.division !== ALL && row.division !== filters.division) return false;
    return true;
  }), [data, dateRange, filters]);
  const activeFilterCount = Number(Boolean(dateRange?.from)) + Object.values(filters).filter((value) => value !== ALL).length;
  useEffect(() => setTablePage(1), [dateRange, filters]);
  const resetFilters = () => {
    setDateRange(undefined);
    setFilters(EMPTY_FILTERS);
  };
  const metrics = useMemo(() => {
    const totalValue = filteredData.reduce((sum, row) => sum + row.value, 0);
    const totalQuantity = filteredData.reduce((sum, row) => sum + row.openQuantity, 0);
    const averageDays = filteredData.reduce((sum, row) => sum + row.daysOpen, 0) / Math.max(1, filteredData.length);
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
    const documentTypes = [...new Set(filteredData.map((row) => row.documentType))].sort().map((name) => {
      const rows = filteredData.filter((row) => row.documentType === name);
      return { name, count: rows.length, value: rows.reduce((sum, row) => sum + row.value, 0) };
    });
    return {
      totalValue,
      totalQuantity,
      averageDays,
      buckets,
      zones,
      partialCount,
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
  const tablePageCount = Math.max(1, Math.ceil(filteredData.length / tablePageSize));
  const tableRows = filteredData.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);
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
    if (!filteredData.length) {
      toast.error("No filtered orders to export");
      return;
    }
    setExcelBusy(true);
    try {
      await downloadOpenSalesOrdersExcel(filteredData);
      toast.success("Open Sales Orders Excel downloaded");
    } catch (downloadError) {
      toast.error(downloadError instanceof Error ? downloadError.message : "Unable to download Excel");
    } finally {
      setExcelBusy(false);
    }
  };

  return (
    <div ref={dashboardRef} className={`mx-auto min-w-0 max-w-[1600px] space-y-4 pb-4 ${pdfBusy ? "pdf-export-theme" : ""}`}>
      {pdfBusy ? <div data-pdf-header className="flex items-center justify-between gap-6 border-b border-border bg-card px-4 py-3">
        <div className="min-w-0"><img src={hblLogo} alt="HBL" className="h-10 w-auto object-contain" /><p className="mt-1 text-xs font-semibold text-card-foreground">HBL Engineering Limited</p></div>
        <div className="text-right"><h2 className="text-base font-semibold text-card-foreground">Open Sales Orders</h2><p className="mt-1 text-xs text-muted-foreground">{pdfDateLabel}</p></div>
      </div> : null}
      <header data-pdf-exclude className="flex items-start justify-between gap-3 px-1">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Open Sales Orders</h1>
          <p className="text-xs text-muted-foreground">Open order position, ageing, delivery status and sales-zone exposure</p>
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
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters} disabled={activeFilterCount === 0}><RotateCcw className="size-3.5" />Reset</Button>
            <Button type="button" variant="ghost" size="icon" aria-label={filtersOpen ? "Collapse Smart Filters" : "Expand Smart Filters"} onClick={() => setFiltersOpen((open) => !open)}>{filtersOpen ? <ChevronUp /> : <ChevronDown />}</Button>
          </div>
        </div>
        {filtersOpen ? <div className="grid gap-3 border-t border-border p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <FilterField label="Date Range">
            <Popover>
              <PopoverTrigger asChild><Button variant="outline" className="h-9 w-full justify-start px-3 text-left text-xs font-normal"><CalendarDays className="size-3.5" /><span className="truncate">{dateRange?.from ? dateRange.to ? `${format(dateRange.from, "dd-MM-yyyy")} – ${format(dateRange.to, "dd-MM-yyyy")}` : format(dateRange.from, "dd-MM-yyyy") : "All dates"}</span></Button></PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start"><Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={1} className="pointer-events-auto p-3" /></PopoverContent>
            </Popover>
          </FilterField>
          <FilterSelect label="Customer" value={filters.customer} options={options.customer} onChange={(customer) => setFilters((current) => ({ ...current, customer }))} />
          <FilterSelect label="Sales Zone" value={filters.zone} options={options.zone} onChange={(zone) => setFilters((current) => ({ ...current, zone }))} />
          <FilterSelect label="Sales Type" value={filters.salesType} options={options.salesType} onChange={(salesType) => setFilters((current) => ({ ...current, salesType }))} />
          <FilterSelect label="Products" value={filters.product} options={options.product} onChange={(product) => setFilters((current) => ({ ...current, product }))} />
          <FilterSelect label="Division" value={filters.division} options={options.division} onChange={(division) => setFilters((current) => ({ ...current, division }))} />
          <FilterSelect label="Document Type" value={filters.documentType} options={options.documentType} onChange={(documentType) => setFilters((current) => ({ ...current, documentType }))} />
        </div> : null}
      </section>

      <div data-pdf-page-block className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Open Orders" value={formatNumber(filteredData.length)} delta={periodChange(filteredData, () => 1)} icon={FileText} tone="primary" />
        <SummaryCard label="Open Order Value" value={formatCr(metrics.totalValue)} delta={periodChange(filteredData, (row) => row.value)} icon={IndianRupee} tone="success" />
        <SummaryCard label="Open Quantity" value={formatNumber(metrics.totalQuantity)} delta={periodChange(filteredData, (row) => row.openQuantity)} icon={Package} tone="violet" />
        <SummaryCard label="Average Days Open" value={formatNumber(metrics.averageDays)} delta={periodChange(filteredData, (row) => row.daysOpen)} icon={Clock3} tone="warning" lowerIsBetter />
      </div>

      <div data-pdf-page-block className="grid gap-4 xl:grid-cols-2">
        <Panel title="Open Orders by Document Type">
          <div className="grid min-h-64 items-center gap-3 sm:grid-cols-[minmax(180px,0.8fr)_minmax(300px,1.2fr)]">
            <div className="relative h-56">
              <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={metrics.documentTypes} dataKey="count" nameKey="name" innerRadius="53%" outerRadius="82%" stroke="var(--card)" strokeWidth={1} isAnimationActive={false}>{metrics.documentTypes.map((item, index) => <Cell key={item.name} fill={COLORS[index]} />)}</Pie><Tooltip formatter={(value: number) => [`${formatNumber(value)} orders`, "Orders"]} /></PieChart></ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-content-center text-center"><strong className="text-xl tabular-nums">{formatNumber(filteredData.length)}</strong><span className="text-xs text-muted-foreground">Total Orders</span></div>
            </div>
            <div className="overflow-hidden rounded-md border border-border text-xs">
              <div className="grid grid-cols-[1fr_64px_92px_48px] bg-primary/5 px-3 py-2 font-semibold text-primary"><span>Document Type</span><span className="text-right">Orders</span><span className="text-right">Value (₹ Cr)</span><span className="text-right">%</span></div>
              {metrics.documentTypes.map((item, index) => <div key={item.name} className="grid grid-cols-[1fr_64px_92px_48px] items-center border-t border-border px-3 py-2"><span className="flex items-center gap-2 font-medium"><span className="size-2.5 rounded-full" style={{ background: COLORS[index] }} />{item.name}</span><span className="text-right tabular-nums">{formatNumber(item.count)}</span><span className="text-right tabular-nums">{item.value.toFixed(2)}</span><span className="text-right tabular-nums">{percent(item.count, filteredData.length)}%</span></div>)}
            </div>
          </div>
        </Panel>
        <Panel title="Open Orders by Aging Bucket">
          <div className="grid min-h-64 grid-cols-[minmax(145px,1fr)_minmax(150px,1fr)] items-center gap-3">
            <div className="relative h-56">
              <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={metrics.buckets} dataKey="count" nameKey="name" innerRadius="54%" outerRadius="82%" stroke="var(--card)" strokeWidth={1} isAnimationActive={false}>{metrics.buckets.map((bucket, index) => <Cell key={bucket.name} fill={COLORS[index]} />)}</Pie><Tooltip formatter={(value: number) => [`${formatNumber(value)} orders`, "Orders"]} /></PieChart></ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-content-center text-center"><strong className="text-lg tabular-nums">{formatNumber(filteredData.length)}</strong><span className="text-xs text-muted-foreground">Orders</span></div>
            </div>
            <div className="divide-y divide-border">{metrics.buckets.map((bucket, index) => <div key={bucket.name} className="grid grid-cols-[10px_1fr_auto] items-center gap-2 py-3 text-xs"><span className="size-2.5 rounded-full" style={{ background: COLORS[index] }} /><span className="text-card-foreground">{bucket.name}</span><span className="text-right"><strong className="block tabular-nums">{formatNumber(bucket.count)}</strong><span className="text-primary">({percent(bucket.count, filteredData.length)}%)</span></span></div>)}</div>
          </div>
        </Panel>
      </div>

      <div data-pdf-page-block className="grid gap-4 xl:grid-cols-2">
        <Panel title="Open Order Value Trend">
          <ResponsiveContainer width="100%" height={250}><BarChart data={metrics.buckets} margin={{ top: 22, right: 8, left: 0, bottom: 10 }}><CartesianGrid vertical={false} stroke="var(--chart-grid-line)" /><XAxis dataKey="name" interval={0} tick={{ fontSize: 10 }} tickFormatter={(value: string) => value.replace(" Days", "")} /><YAxis tick={{ fontSize: 10 }} label={{ value: "Value (₹ Cr)", angle: -90, position: "insideLeft", fontSize: 10 }} /><Tooltip formatter={(value: number, name: string) => [formatCr(value), name]} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar name="Open Orders" dataKey="value" stackId="value" fill="var(--kpi-1)" isAnimationActive={false}><LabelList dataKey="value" position="top" formatter={(value: number) => value.toFixed(1)} className="fill-foreground text-[10px]" /></Bar><Bar name="Partial Delivered" dataKey="partialValue" stackId="value" fill="var(--kpi-2)" radius={[3, 3, 0, 0]} isAnimationActive={false} /></BarChart></ResponsiveContainer>
        </Panel>
        <Panel title="Open Order Lines by Sales Zone">
          <ResponsiveContainer width="100%" height={Math.max(280, metrics.zones.length * 27)}><BarChart data={metrics.zones} layout="vertical" margin={{ top: 8, right: 92, left: 22, bottom: 24 }}><CartesianGrid horizontal={false} stroke="var(--chart-grid-line)" /><XAxis type="number" tick={{ fontSize: 10 }} label={{ value: "Open Order Lines", position: "insideBottom", offset: -12, fontSize: 10 }} /><YAxis type="category" dataKey="name" width={88} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip content={({ active, payload }) => active && payload?.[0]?.payload ? <SalesZoneTooltip item={payload[0].payload as ZoneItem} /> : null} /><Bar dataKey="count" name="Open Order Lines" radius={[0, 3, 3, 0]} isAnimationActive={false}>{metrics.zones.map((zone, index) => <Cell key={zone.name} fill={COLORS[index % COLORS.length]} />)}<LabelList dataKey="count" position="right" formatter={(value: number) => `${formatNumber(value)} lines (${percent(value, filteredData.length)}%)`} className="fill-foreground text-[10px] font-semibold" /></Bar></BarChart></ResponsiveContainer>
        </Panel>
      </div>

      <div data-pdf-page-block className="grid gap-4 lg:grid-cols-[0.72fr_0.8fr_1.85fr]">
        <StatusCard title="Open Orders (Not Delivered)" count={metrics.notDeliveredCount} share={percent(metrics.notDeliveredCount, filteredData.length)} />
        <StatusCard title="Partial Delivered Orders" count={metrics.partialCount} share={percent(metrics.partialCount, filteredData.length)} partial />
        <section className="overflow-hidden rounded-md border border-border bg-card shadow-tile">
          <h2 className="bg-muted px-4 py-2 text-sm font-semibold text-primary">Quick View</h2>
          <div className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <QuickItem icon={CalendarDays} tone="primary" label="Longest Aging" value={`${formatNumber(metrics.longest?.daysOpen ?? 0)} Days`} detail={`Customer: ${metrics.longest?.customer ?? "—"}`} />
            <QuickItem icon={TriangleAlert} tone="destructive" label="Highest Value" value={formatCr(metrics.highestValue?.value ?? 0)} detail={`Customer: ${metrics.highestValue?.customer ?? "—"}`} />
            <QuickItem icon={Box} tone="primary" label="Highest Quantity" value={formatNumber(metrics.highestQuantity?.openQuantity ?? 0)} detail={`Product: ${metrics.highestQuantity?.material ?? "—"}`} />
          </div>
        </section>
      </div>

      <div data-pdf-page-block data-pdf-section-break className="grid gap-4 xl:grid-cols-3">
        <RankingPanel title="Top 10 Open Orders by Customer" data={metrics.customers} />
        <RankingPanel title="Top 10 Open Orders by Product" data={metrics.products} />
        <RankingPanel title="Open Orders by Model Wise" data={metrics.models} />
      </div>

      <section data-pdf-page-block data-pdf-section-break className="overflow-hidden rounded-md border border-border bg-card shadow-tile">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div><h2 className="text-sm font-semibold text-card-foreground">Open Sales Orders – Detailed View (Aging Bucket)</h2><p className="text-[10px] text-muted-foreground">{formatNumber(filteredData.length)} filtered orders</p></div>
          <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Page {tablePage} of {tablePageCount}</span><Button data-pdf-exclude type="button" variant="outline" size="sm" disabled={excelBusy || !filteredData.length} onClick={downloadExcel}><FileSpreadsheet className="size-4" />{excelBusy ? "Preparing…" : "Download Excel"}</Button></div>
        </div>
        <Table>
          <TableHeader className="bg-primary/5"><TableRow>{["#", "Order No.", "POSNR", "Customer", "Document Type", "Sales Zone", "Division", "Product", "Product Description", "Order Date", "Requested Date", "Days Open", "Open Qty", "Delivered Qty", "Open Value (₹ Cr)", "Status"].map((heading) => <TableHead key={heading} className="h-9 whitespace-nowrap text-[10px] font-semibold text-primary">{heading}</TableHead>)}</TableRow></TableHeader>
          <TableBody>{tableRows.length ? tableRows.map((row, index) => <TableRow key={`${row.order}:${row.item}`} className="text-[11px]"><TableCell>{(tablePage - 1) * tablePageSize + index + 1}</TableCell><TableCell className="whitespace-nowrap font-medium text-primary">{row.order}</TableCell><TableCell className="whitespace-nowrap">{row.item}</TableCell><TableCell className="whitespace-nowrap">{row.customer}</TableCell><TableCell>{row.documentType}</TableCell><TableCell className="whitespace-nowrap">{row.zone.replace(" Zone", "")}</TableCell><TableCell>{row.division}</TableCell><TableCell className="whitespace-nowrap">{row.material}</TableCell><TableCell className="min-w-56">{row.description}</TableCell><TableCell className="whitespace-nowrap">{displayDate(row.orderDate)}</TableCell><TableCell className="whitespace-nowrap">{displayDate(row.deliveryDate)}</TableCell><TableCell className="text-right tabular-nums">{formatNumber(row.daysOpen)}</TableCell><TableCell className="text-right tabular-nums">{formatNumber(row.openQuantity)}</TableCell><TableCell className="text-right tabular-nums">{formatNumber(row.deliveredQuantity)}</TableCell><TableCell className="text-right tabular-nums">{row.value.toFixed(2)}</TableCell><TableCell><StatusBadge partial={row.deliveredQuantity > 0} /></TableCell></TableRow>) : <TableRow><TableCell colSpan={16} className="h-24 text-center text-muted-foreground">{isLoading ? "Loading current Open Sales Orders…" : "No open orders match the selected filters."}</TableCell></TableRow>}</TableBody>
        </Table>
        <div data-pdf-exclude className="flex items-center justify-end gap-2 border-t border-border px-4 py-3"><Button variant="outline" size="sm" aria-label="Previous table page" disabled={tablePage <= 1} onClick={() => setTablePage((page) => Math.max(1, page - 1))}><ChevronLeft />Previous</Button><Button variant="outline" size="sm" aria-label="Next table page" disabled={tablePage >= tablePageCount} onClick={() => setTablePage((page) => Math.min(tablePageCount, page + 1))}>Next<ChevronRight /></Button></div>
      </section>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="min-w-0 space-y-1"><span className="block text-[10px] font-medium text-muted-foreground">{label}</span>{children}</label>;
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <FilterField label={label}><Select value={value} onValueChange={onChange}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>All</SelectItem>{options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></FilterField>;
}

function RankingPanel({ title, data }: { title: string; data: RankedItem[] }) {
  return <Panel title={title}>{data.length ? <ResponsiveContainer width="100%" height={300}><BarChart data={data} layout="vertical" margin={{ top: 5, right: 52, left: 4, bottom: 5 }}><CartesianGrid horizontal={false} stroke="var(--chart-grid-line)" /><XAxis type="number" tick={{ fontSize: 10 }} /><YAxis type="category" dataKey="name" width={142} tick={<RankingAxisTick />} axisLine={false} tickLine={false} /><Tooltip formatter={(value: number, name: string, item) => name === "Open Value" ? [formatCr(value), name] : [value, name]} content={({ active, payload }) => active && payload?.[0]?.payload ? <RankingTooltip item={payload[0].payload as RankedItem} /> : null} /><Bar dataKey="value" name="Open Value" fill="var(--kpi-1)" radius={[0, 3, 3, 0]} isAnimationActive={false}><LabelList dataKey="value" position="right" formatter={(value: number) => value.toFixed(1)} className="fill-foreground text-[10px] font-semibold" /></Bar></BarChart></ResponsiveContainer> : <div className="grid h-[300px] place-items-center text-sm text-muted-foreground">No matching orders</div>}</Panel>;
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
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${partial ? "bg-warning/20 text-warning-foreground" : "bg-primary/10 text-primary"}`}>{partial ? "Partially Delivered" : "Open"}</span>;
}

function displayDate(value: string) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "—" : format(date, "dd-MMM-yyyy");
}

function QuickItem({ icon: Icon, tone, label, value, detail }: { icon: ComponentType<{ className?: string }>; tone: "primary" | "destructive"; label: string; value: string; detail: string }) {
  return <div className="flex min-w-0 items-start gap-3 p-4"><span className={`grid size-10 shrink-0 place-items-center rounded-full ${tone === "destructive" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}><Icon className="size-5" /></span><div className="min-w-0"><p className="text-[10px] text-muted-foreground">{label}</p><p className="mt-0.5 text-base font-semibold text-card-foreground tabular-nums">{value}</p><p className="mt-1 truncate text-[10px] text-primary" title={detail}>({detail})</p></div></div>;
}