import { useMemo, useState, type ComponentType } from "react";
import {
  AlertTriangle,
  Box,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  FileText,
  Lightbulb,
  PackageOpen,
  Percent,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getOpenSalesOrders, type OpenSalesOrder } from "@/lib/open-sales-orders-data";
import { useQuery } from "@tanstack/react-query";

const COLORS = ["var(--kpi-1)", "var(--kpi-5)", "var(--kpi-3)", "var(--kpi-6)", "var(--kpi-4)", "var(--chart-axis-line)"];
const PAGE_SIZE = 5;

type FilterKey = "salesOrg" | "channel" | "office" | "customer" | "salesGroup";
type Filters = Record<FilterKey, string>;
const EMPTY_FILTERS: Filters = { salesOrg: "All", channel: "All", office: "All", customer: "All", salesGroup: "All" };

const formatCr = (value: number) => `₹ ${value.toFixed(2)} Cr`;
const formatDate = (value: string) => new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

function aggregate(rows: OpenSalesOrder[], key: keyof OpenSalesOrder) {
  const map = new Map<string, { name: string; value: number; quantity: number; count: number }>();
  for (const row of rows) {
    const name = String(row[key]);
    const current = map.get(name) ?? { name, value: 0, quantity: 0, count: 0 };
    current.value += row.value;
    current.quantity += row.quantity;
    current.count += 1;
    map.set(name, current);
  }
  return [...map.values()].sort((a, b) => b.value - a.value);
}

function Panel({ title, children, className = "", unit }: { title: string; children: React.ReactNode; className?: string; unit?: string }) {
  return (
    <section className={`rounded-md border border-border bg-card p-3 shadow-tile ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-card-foreground">{title}</h2>
        {unit ? <span className="text-[10px] font-medium text-muted-foreground">{unit}</span> : null}
      </div>
      {children}
    </section>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="rounded-md border border-border bg-card px-3 py-2 shadow-tile">
      <span className="block text-[10px] font-medium text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-0.5 h-6 border-0 p-0 text-xs font-medium shadow-none focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
        </SelectContent>
      </Select>
    </label>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const min = Math.min(...values);
  const span = Math.max(1, Math.max(...values) - min);
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${24 - ((value - min) / span) * 18}`).join(" ");
  return <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="mt-2 h-7 w-full" aria-hidden="true"><polyline points={points} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg>;
}

function KpiCard({ label, value, delta, icon: Icon, tone, down = false, values }: { label: string; value: string; delta: string; icon: ComponentType<{ className?: string }>; tone: number; down?: boolean; values: number[] }) {
  const color = COLORS[tone % COLORS.length] ?? "var(--color-primary)";
  return (
    <section className="min-w-0 rounded-md border border-border bg-card p-3 shadow-tile">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full" style={{ background: `color-mix(in oklab, ${color} 16%, var(--color-card))`, color }}><Icon className="size-5" /></span>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium text-muted-foreground">{label}</p>
          <p className="mt-0.5 truncate text-xl font-semibold text-card-foreground tabular">{value}</p>
          <p className={`mt-1 flex items-center gap-1 text-[10px] ${down ? "text-destructive" : "text-success"}`}>
            {down ? <TrendingDown className="size-3" /> : <TrendingUp className="size-3" />}{delta}
            <span className="text-muted-foreground">vs. last month</span>
          </p>
        </div>
      </div>
      <Sparkline values={values} color={color} />
    </section>
  );
}

function Donut({ data, centre, sublabel }: { data: ReturnType<typeof aggregate>; centre: string; sublabel: string }) {
  return (
    <div className="grid min-h-[185px] grid-cols-[minmax(130px,1fr)_1fr] items-center gap-1">
      <div className="relative h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius="52%" outerRadius="76%" paddingAngle={1}>{data.map((entry, i) => <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v: number) => formatCr(v)} /></PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center"><strong className="text-sm tabular">{centre}</strong><span className="text-[10px] text-muted-foreground">{sublabel}</span></div>
      </div>
      <div className="space-y-2">
        {data.map((item, i) => <div key={item.name} className="grid grid-cols-[8px_1fr_auto] items-center gap-2 text-[10px]"><span className="size-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} /><span className="truncate text-muted-foreground">{item.name}</span><strong className="tabular">{Math.round((item.value / Math.max(1, data.reduce((sum, d) => sum + d.value, 0))) * 100)}%</strong></div>)}
      </div>
    </div>
  );
}

export function OpenSalesOrdersDashboard() {
  const { data = [] } = useQuery({ queryKey: ["open-sales-orders-sample"], queryFn: getOpenSalesOrders, staleTime: Infinity });
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [trendMode, setTrendMode] = useState<"Value" | "Quantity" | "Both">("Value");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => data.filter((row) => (Object.keys(filters) as FilterKey[]).every((key) => filters[key] === "All" || row[key] === filters[key])), [data, filters]);
  const setFilter = (key: FilterKey, value: string) => { setFilters((current) => ({ ...current, [key]: value })); setPage(1); };
  const options = (key: FilterKey) => ["All", ...new Set(data.map((row) => row[key]))];
  const totalValue = filtered.reduce((sum, row) => sum + row.value, 0);
  const totalQuantity = filtered.reduce((sum, row) => sum + row.quantity, 0);
  const avgDays = filtered.reduce((sum, row) => sum + row.daysOpen, 0) / Math.max(1, filtered.length);
  const otd = (filtered.filter((row) => row.onTime).length / Math.max(1, filtered.length)) * 100;
  const byZone = aggregate(filtered, "zone");
  const byType = aggregate(filtered, "salesType");
  const byPc = aggregate(filtered, "profitCentre").slice(0, 5);
  const byGroup = aggregate(filtered, "mainGroup").slice(0, 5);
  const byCategory = aggregate(filtered, "category").slice(0, 5);
  const byCustomer = aggregate(filtered, "customer").slice(0, 5);
  const trend = useMemo(() => {
    const map = new Map<string, { month: string; value: number; quantity: number }>();
    for (const row of filtered) {
      const month = row.orderDate.slice(0, 7);
      const current = map.get(month) ?? { month, value: 0, quantity: 0 };
      current.value += row.value; current.quantity += row.quantity / 1_000; map.set(month, current);
    }
    return [...map.values()].sort((a, b) => a.month.localeCompare(b.month)).map((row) => ({ ...row, label: new Date(`${row.month}-01T00:00:00Z`).toLocaleDateString("en", { month: "short", year: "2-digit", timeZone: "UTC" }) }));
  }, [filtered]);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const highestZone = byZone[0]?.name ?? "—";
  const highestGroup = byGroup[0]?.name ?? "—";

  return (
    <div className="space-y-3">
      <header><h1 className="text-2xl font-semibold text-foreground">Open Sales Orders</h1><p className="text-sm text-muted-foreground">Monitor and manage open sales orders across regions, customers and products</p></header>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-md border border-border bg-card px-3 py-2 shadow-tile"><span className="block text-[10px] font-medium text-muted-foreground">Date Range</span><span className="mt-1 flex items-center justify-between text-xs font-medium">01 Apr 2024 - 30 Apr 2025 <CalendarDays className="size-4 text-primary" /></span></div>
        <FilterSelect label="Sales Organization" value={filters.salesOrg} options={options("salesOrg")} onChange={(v) => setFilter("salesOrg", v)} />
        <FilterSelect label="Distribution Channel" value={filters.channel} options={options("channel")} onChange={(v) => setFilter("channel", v)} />
        <FilterSelect label="Sales Office" value={filters.office} options={options("office")} onChange={(v) => setFilter("office", v)} />
        <FilterSelect label="Customer" value={filters.customer} options={options("customer")} onChange={(v) => setFilter("customer", v)} />
        <FilterSelect label="Sales Group" value={filters.salesGroup} options={options("salesGroup")} onChange={(v) => setFilter("salesGroup", v)} />
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total Open Sales Orders" value={filtered.length.toLocaleString("en-IN")} delta="▲ 12%" icon={FileText} tone={0} values={[4, 6, 5, 8, 9, 12, 8, 13, 10, 15, 12, 16]} />
        <KpiCard label="Open Order Value" value={formatCr(totalValue)} delta="▲ 8%" icon={CircleDollarSign} tone={1} values={[5, 8, 6, 10, 7, 12, 7, 8, 13, 15, 11, 16]} />
        <KpiCard label="Open Quantity" value={Math.round(totalQuantity).toLocaleString("en-IN")} delta="▲ 10%" icon={PackageOpen} tone={3} values={[5, 7, 6, 9, 8, 13, 8, 10, 9, 11, 10, 14]} />
        <KpiCard label="Avg. Order Value" value={formatCr(totalValue / Math.max(1, filtered.length))} delta="▲ 6%" icon={Box} tone={4} values={[4, 7, 6, 10, 7, 11, 9, 12, 11, 13, 12, 16]} />
        <KpiCard label="Avg. Days in Open" value={`${avgDays.toFixed(1)} Days`} delta="▼ 22%" icon={Clock3} tone={5} down values={[5, 7, 8, 10, 9, 13, 11, 15, 13, 16, 14, 17]} />
        <KpiCard label="OTD (On-Time Delivery)" value={`${otd.toFixed(0)}%`} delta="▲ 9%" icon={Percent} tone={0} values={[4, 8, 7, 10, 8, 12, 11, 16, 15, 13, 10, 17]} />
      </div>

      <div className="grid gap-2 xl:grid-cols-12">
        <Panel title="Open Sales Order Trend" className="xl:col-span-6">
          <div className="mb-1 flex justify-end gap-1">{(["Value", "Quantity", "Both"] as const).map((mode) => <Button key={mode} variant={trendMode === mode ? "default" : "ghost"} size="sm" className="h-6 px-3 text-[10px]" onClick={() => setTrendMode(mode)}>{mode}</Button>)}</div>
          <ResponsiveContainer width="100%" height={190}><ComposedChart data={trend}><CartesianGrid vertical={false} stroke="var(--chart-grid-line)" /><XAxis dataKey="label" tick={{ fontSize: 9 }} /><YAxis yAxisId="left" tick={{ fontSize: 9 }} /><YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />{trendMode !== "Quantity" ? <Bar yAxisId="left" name="Open Order Value (₹ Cr)" dataKey="value" fill="var(--kpi-1)" radius={[2, 2, 0, 0]} /> : null}{trendMode !== "Value" ? <Line yAxisId="right" name="Open Quantity (K)" dataKey="quantity" stroke="var(--kpi-5)" strokeWidth={2} dot={{ r: 2 }} /> : null}</ComposedChart></ResponsiveContainer>
        </Panel>
        <Panel title="Open Orders by Sales Zone" className="xl:col-span-3"><Donut data={byZone} centre={formatCr(totalValue)} sublabel="Total Value" /></Panel>
        <Panel title="Open Orders by Sales Type" className="xl:col-span-3"><Donut data={byType} centre={totalQuantity.toLocaleString("en-IN")} sublabel="Quantity" /></Panel>
      </div>

      <div className="grid gap-2 lg:grid-cols-2 xl:grid-cols-4">
        <Panel title="Open Order Value by Profit Center" unit="₹ Cr"><ResponsiveContainer width="100%" height={180}><BarChart data={byPc} layout="vertical" margin={{ left: 5, right: 20 }}><XAxis type="number" tick={{ fontSize: 9 }} /><YAxis type="category" dataKey="name" width={62} tick={{ fontSize: 9 }} /><Tooltip formatter={(v: number) => formatCr(v)} /><Bar dataKey="value" fill="var(--kpi-1)" radius={[0, 3, 3, 0]} /></BarChart></ResponsiveContainer></Panel>
        <Panel title="Open Orders by Main Group" unit="₹ Cr"><ResponsiveContainer width="100%" height={180}><BarChart data={byGroup}><XAxis dataKey="name" tick={{ fontSize: 9 }} /><YAxis hide /><Tooltip formatter={(v: number) => formatCr(v)} /><Bar dataKey="value" radius={[3, 3, 0, 0]}>{byGroup.map((d, i) => <Cell key={d.name} fill={COLORS[i % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer></Panel>
        <Panel title="Open Orders by Customer (Top 5)"><table className="w-full text-[10px]"><thead className="bg-muted text-muted-foreground"><tr><th className="px-2 py-2 text-left">Customer</th><th className="px-2 text-right">Open Value (₹ Cr)</th><th className="px-2 text-right">Open Qty</th><th className="px-2 text-right">% of Total</th></tr></thead><tbody>{byCustomer.map((row) => <tr key={row.name} className="border-t border-border"><td className="px-2 py-2 font-medium">{row.name}</td><td className="px-2 text-right tabular">{row.value.toFixed(2)}</td><td className="px-2 text-right tabular">{row.quantity.toLocaleString("en-IN")}</td><td className="px-2 text-right tabular">{((row.value / Math.max(1, totalValue)) * 100).toFixed(1)}%</td></tr>)}</tbody></table></Panel>
        <Panel title="Open Orders by Product Category" unit="₹ Cr"><ResponsiveContainer width="100%" height={180}><BarChart data={byCategory} layout="vertical" margin={{ left: 5, right: 20 }}><XAxis type="number" tick={{ fontSize: 9 }} /><YAxis type="category" dataKey="name" width={62} tick={{ fontSize: 9 }} /><Tooltip formatter={(v: number) => formatCr(v)} /><Bar dataKey="value" fill="var(--kpi-4)" radius={[0, 3, 3, 0]} /></BarChart></ResponsiveContainer></Panel>
      </div>

      <div className="grid gap-2 xl:grid-cols-2">
        <Panel title="Open Sales Orders - Detailed View">
          <div className="overflow-x-auto"><table className="min-w-[700px] w-full text-[10px]"><thead className="bg-muted text-primary"><tr>{["Sales Order", "Customer", "Material", "Description", "Open Qty", "Open Value (₹ Cr)", "Delivery Date", "Status"].map((h) => <th key={h} className="px-2 py-2 text-left font-medium">{h}</th>)}</tr></thead><tbody>{paged.map((row) => <tr key={row.order} className="border-t border-border"><td className="px-2 py-2 font-medium text-primary">{row.order}</td><td className="px-2">{row.customer}</td><td className="px-2">{row.material}</td><td className="px-2">{row.description}</td><td className="px-2 text-right tabular">{row.quantity.toLocaleString("en-IN")}</td><td className="px-2 text-right tabular">{row.value.toFixed(2)}</td><td className="px-2 whitespace-nowrap">{formatDate(row.deliveryDate)}</td><td className="px-2"><span className="rounded-full bg-destructive/10 px-2 py-1 text-destructive">Open</span></td></tr>)}</tbody></table></div>
          <div className="mt-3 flex items-center justify-between"><div className="flex gap-1"><Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹</Button>{Array.from({ length: Math.min(5, pages) }, (_, i) => i + 1).map((p) => <Button key={p} size="sm" variant={p === page ? "default" : "ghost"} onClick={() => setPage(p)}>{p}</Button>)}<Button size="sm" variant="outline" disabled={page === pages} onClick={() => setPage((p) => p + 1)}>›</Button></div><span className="text-[10px] text-muted-foreground">Showing {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span></div>
        </Panel>

        <Panel title="Key Insights">
          <div className="grid min-h-[230px] gap-4 md:grid-cols-2">
            <div className="space-y-4 border-border md:border-r md:pr-4">
              <div><h3 className="flex items-center gap-2 text-xs font-semibold text-success"><TrendingUp className="size-4" />Positive Trends</h3><ul className="mt-2 list-disc space-y-1 pl-7 text-[10px] text-muted-foreground"><li>Open order value increased by 8% compared to last month.</li><li>{highestZone} contributes the highest share of open orders.</li><li>{highestGroup} has the highest value.</li></ul></div>
              <div><h3 className="flex items-center gap-2 text-xs font-semibold text-warning"><AlertTriangle className="size-4" />Areas to Watch</h3><ul className="mt-2 list-disc space-y-1 pl-7 text-[10px] text-muted-foreground"><li>{filtered.filter((row) => row.daysOpen > 21).length} orders have been open for more than 21 days.</li><li>Top customers account for {Math.round((byCustomer.reduce((s, r) => s + r.value, 0) / Math.max(1, totalValue)) * 100)}% of open value.</li></ul></div>
            </div>
            <div className="space-y-4">
              <div><h3 className="flex items-center gap-2 text-xs font-semibold text-destructive"><AlertTriangle className="size-4" />Alerts</h3><ul className="mt-2 list-disc space-y-1 pl-7 text-[10px] text-muted-foreground"><li>{filtered.filter((row) => !row.onTime).length} orders may miss their delivery date.</li><li>{byCategory[0]?.name ?? "Top category"} carries the largest pending value.</li><li>{byPc[0]?.name ?? "Top profit centre"} has the highest open exposure.</li></ul></div>
              <div className="rounded-md bg-accent p-3"><h3 className="flex items-center gap-2 text-xs font-semibold text-primary"><Lightbulb className="size-4" />Recommendation</h3><p className="mt-1 pl-6 text-[10px] text-accent-foreground">Follow up with high-value customers and expedite long-open orders to reduce ageing.</p></div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}