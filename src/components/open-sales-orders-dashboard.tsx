import { useMemo, type ComponentType, type ReactNode } from "react";
import {
  Box,
  CalendarDays,
  Clock3,
  FileText,
  IndianRupee,
  Package,
  TriangleAlert,
  Truck,
} from "lucide-react";
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

const COLORS = ["var(--kpi-1)", "var(--kpi-5)", "var(--kpi-3)", "var(--kpi-4)", "var(--kpi-2)"];
const formatCr = (value: number) => `₹ ${value.toFixed(2)} Cr`;
const formatNumber = (value: number) => Math.round(value).toLocaleString("en-IN");

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
  const { data = [] } = useQuery({ queryKey: ["open-sales-orders-sample"], queryFn: getOpenSalesOrders, staleTime: Infinity });
  const metrics = useMemo(() => {
    const totalValue = data.reduce((sum, row) => sum + row.value, 0);
    const totalQuantity = data.reduce((sum, row) => sum + row.openQuantity, 0);
    const averageDays = data.reduce((sum, row) => sum + row.daysOpen, 0) / Math.max(1, data.length);
    const buckets = [
      { name: "1 – 180 Days", rows: data.filter((row) => row.daysOpen <= 180) },
      { name: "181 – 365 Days", rows: data.filter((row) => row.daysOpen > 180 && row.daysOpen <= 365) },
      { name: "> 365 Days", rows: data.filter((row) => row.daysOpen > 365) },
    ].map((bucket) => ({ ...bucket, count: bucket.rows.length, value: bucket.rows.reduce((sum, row) => sum + row.value, 0), partialValue: bucket.rows.filter((row) => row.deliveredQuantity > 0).reduce((sum, row) => sum + row.value, 0) }));
    const zoneMap = new Map<string, number>();
    data.forEach((row) => zoneMap.set(row.zone.replace(" Zone", ""), (zoneMap.get(row.zone.replace(" Zone", "")) ?? 0) + 1));
    const zones = [...zoneMap].map(([name, count]) => ({ name, count, share: percent(count, data.length) })).sort((a, b) => b.count - a.count);
    const partialCount = data.filter((row) => row.deliveredQuantity > 0).length;
    return {
      totalValue,
      totalQuantity,
      averageDays,
      buckets,
      zones,
      partialCount,
      notDeliveredCount: data.length - partialCount,
      longest: [...data].sort((a, b) => b.daysOpen - a.daysOpen)[0],
      highestValue: [...data].sort((a, b) => b.value - a.value)[0],
      highestQuantity: [...data].sort((a, b) => b.openQuantity - a.openQuantity)[0],
    };
  }, [data]);

  return (
    <div className="mx-auto min-w-0 max-w-[1600px] space-y-4 pb-4">
      <header className="px-1">
        <h1 className="text-xl font-semibold text-foreground">Open Sales Orders</h1>
        <p className="text-xs text-muted-foreground">Open order position, ageing, delivery status and sales-zone exposure</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Open Orders" value={formatNumber(data.length)} delta={periodChange(data, () => 1)} icon={FileText} tone="primary" />
        <SummaryCard label="Open Order Value" value={formatCr(metrics.totalValue)} delta={periodChange(data, (row) => row.value)} icon={IndianRupee} tone="success" />
        <SummaryCard label="Open Quantity" value={formatNumber(metrics.totalQuantity)} delta={periodChange(data, (row) => row.openQuantity)} icon={Package} tone="violet" />
        <SummaryCard label="Average Days Open" value={formatNumber(metrics.averageDays)} delta={periodChange(data, (row) => row.daysOpen)} icon={Clock3} tone="warning" lowerIsBetter />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.08fr_0.94fr_1fr]">
        <Panel title="Open Orders by Aging Bucket">
          <div className="grid min-h-64 grid-cols-[minmax(145px,1fr)_minmax(150px,1fr)] items-center gap-3">
            <div className="relative h-56">
              <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={metrics.buckets} dataKey="count" nameKey="name" innerRadius="54%" outerRadius="82%" stroke="var(--card)" strokeWidth={1}>{metrics.buckets.map((bucket, index) => <Cell key={bucket.name} fill={COLORS[index]} />)}</Pie><Tooltip formatter={(value: number) => [`${formatNumber(value)} orders`, "Orders"]} /></PieChart></ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-content-center text-center"><strong className="text-lg tabular-nums">{formatNumber(data.length)}</strong><span className="text-xs text-muted-foreground">Orders</span></div>
            </div>
            <div className="divide-y divide-border">{metrics.buckets.map((bucket, index) => <div key={bucket.name} className="grid grid-cols-[10px_1fr_auto] items-center gap-2 py-3 text-xs"><span className="size-2.5 rounded-full" style={{ background: COLORS[index] }} /><span className="text-card-foreground">{bucket.name}</span><span className="text-right"><strong className="block tabular-nums">{formatNumber(bucket.count)}</strong><span className="text-primary">({percent(bucket.count, data.length)}%)</span></span></div>)}</div>
          </div>
        </Panel>
        <Panel title="Open Order Value Trend">
          <ResponsiveContainer width="100%" height={250}><BarChart data={metrics.buckets} margin={{ top: 22, right: 8, left: 0, bottom: 10 }}><CartesianGrid vertical={false} stroke="var(--chart-grid-line)" /><XAxis dataKey="name" interval={0} tick={{ fontSize: 10 }} tickFormatter={(value: string) => value.replace(" Days", "")} /><YAxis tick={{ fontSize: 10 }} label={{ value: "Value (₹ Cr)", angle: -90, position: "insideLeft", fontSize: 10 }} /><Tooltip formatter={(value: number, name: string) => [formatCr(value), name]} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar name="Open Orders" dataKey="value" stackId="value" fill="var(--kpi-1)"><LabelList dataKey="value" position="top" formatter={(value: number) => value.toFixed(1)} className="fill-foreground text-[10px]" /></Bar><Bar name="Partial Delivered" dataKey="partialValue" stackId="value" fill="var(--kpi-2)" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer>
        </Panel>
        <Panel title="Open Orders by Sales Zone">
          <ResponsiveContainer width="100%" height={250}><BarChart data={metrics.zones} layout="vertical" margin={{ top: 8, right: 54, left: 12, bottom: 5 }}><CartesianGrid horizontal={false} stroke="var(--chart-grid-line)" /><XAxis type="number" tick={{ fontSize: 10 }} /><YAxis type="category" dataKey="name" width={50} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value: number) => [`${formatNumber(value)} orders`, "Open Orders"]} /><Bar dataKey="count" radius={[0, 3, 3, 0]}>{metrics.zones.map((zone, index) => <Cell key={zone.name} fill={COLORS[index % COLORS.length]} />)}<LabelList dataKey="count" position="right" formatter={(value: number) => `${value} (${percent(value, data.length)}%)`} className="fill-foreground text-[10px] font-semibold" /></Bar></BarChart></ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.72fr_0.8fr_1.85fr]">
        <StatusCard title="Open Orders (Not Delivered)" count={metrics.notDeliveredCount} share={percent(metrics.notDeliveredCount, data.length)} />
        <StatusCard title="Partial Delivered Orders" count={metrics.partialCount} share={percent(metrics.partialCount, data.length)} partial />
        <section className="overflow-hidden rounded-md border border-border bg-card shadow-tile">
          <h2 className="bg-muted px-4 py-2 text-sm font-semibold text-primary">Quick View</h2>
          <div className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <QuickItem icon={CalendarDays} tone="primary" label="Longest Aging" value={`${formatNumber(metrics.longest?.daysOpen ?? 0)} Days`} detail={`Customer: ${metrics.longest?.customer ?? "—"}`} />
            <QuickItem icon={TriangleAlert} tone="destructive" label="Highest Value" value={formatCr(metrics.highestValue?.value ?? 0)} detail={`Customer: ${metrics.highestValue?.customer ?? "—"}`} />
            <QuickItem icon={Box} tone="primary" label="Highest Quantity" value={formatNumber(metrics.highestQuantity?.openQuantity ?? 0)} detail={`Product: ${metrics.highestQuantity?.material ?? "—"}`} />
          </div>
        </section>
      </div>
    </div>
  );
}

function QuickItem({ icon: Icon, tone, label, value, detail }: { icon: ComponentType<{ className?: string }>; tone: "primary" | "destructive"; label: string; value: string; detail: string }) {
  return <div className="flex min-w-0 items-start gap-3 p-4"><span className={`grid size-10 shrink-0 place-items-center rounded-full ${tone === "destructive" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}><Icon className="size-5" /></span><div className="min-w-0"><p className="text-[10px] text-muted-foreground">{label}</p><p className="mt-0.5 text-base font-semibold text-card-foreground tabular-nums">{value}</p><p className="mt-1 truncate text-[10px] text-primary" title={detail}>({detail})</p></div></div>;
}