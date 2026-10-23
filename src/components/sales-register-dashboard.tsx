import { toCr, toLah } from "@/lib/sales-register";
import { useId, useMemo, useState, type ReactNode } from "react";
import { OrderBookSubGroupChart } from "@/components/order-book-subgroup-chart";
import { summarizeGroupsByDivision } from "@/lib/open-orders-groups";
import { FileText, IndianRupee, Receipt, Search, Users, BarChart3, FileSpreadsheet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { downloadSalesRegisterExcel } from "@/lib/sales-register-export";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildSalesRegister, salesRegisterGroupRows, salesRegisterTrend, type SalesRegisterDateRange, type SalesRegisterRow } from "@/lib/sales-register";

const COLORS = ["#1f6fd1", "#0f9d8a", "#2e8b57", "#e08a1e", "#8e44ad", "#d64550", "#3a8dde", "#16a3b8", "#c0841a", "#5c6bc0"];
const cr = (v: number) => Math.round((v / 1e7) * 100) / 100;
const inr = (v: number) => `₹ ${Math.round(v).toLocaleString("en-IN")}`;

function Card({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return <section className={`flex min-w-0 flex-col rounded-xl border border-border bg-card p-2 shadow-sm ${className}`}>
    <h2 className="mb-1 text-xs font-semibold text-card-foreground">{title}</h2>
    <div className="min-h-0 flex-1">{children}</div>
  </section>;
}
const Empty = () => <div className="grid h-full min-h-[140px] place-items-center text-xs text-muted-foreground">No data yet</div>;

function Tile({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: string }) {
  return <div className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-sm" style={{ backgroundImage: `linear-gradient(135deg, color-mix(in oklab, ${tone} 12%, transparent), transparent)` }}>
    <div className="grid size-8 shrink-0 place-items-center rounded-full text-primary-foreground" style={{ background: tone }}>{icon}</div>
    <div className="min-w-0"><p className="truncate text-xs font-semibold text-foreground">{label}</p>
      <p className="truncate text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">vs. previous period</p></div>
  </div>;
}

function grad(id: string, horizontal = false) {
  return <defs>{COLORS.map((c, i) => <linearGradient key={i} id={`${id}-${i}`} x1="0" y1="0" x2={horizontal ? "1" : "0"} y2={horizontal ? "0" : "1"}>
    <stop offset="0%" style={{ stopColor: c, stopOpacity: 0.55 }} /><stop offset="55%" style={{ stopColor: c, stopOpacity: 0.9 }} />
    <stop offset="100%" style={{ stopColor: c, stopOpacity: 1 }} /></linearGradient>)}</defs>;
}

const shortPlant = (name: string) => { const rest = name.split(" ").slice(1).join(" ") || name; return rest.length > 14 ? `${rest.slice(0, 13)}…` : rest; };

function PlantColumns({ data }: { data: { name: string; value: number }[] }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  if (!data.length) return <Empty />;
  return <ResponsiveContainer width="100%" height={170}><BarChart data={data.map((d) => ({ ...d, value: cr(d.value) }))} margin={{ top: 16, left: -16, right: 4, bottom: 0 }}>{grad(id)}
    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
    <XAxis dataKey="name" interval={0} tick={{ fontSize: 8, fontWeight: 600 }} tickFormatter={shortPlant} angle={-30} textAnchor="end" height={40} />
    <YAxis tick={{ fontSize: 9 }} /><Tooltip formatter={(v: number) => `₹ ${v} Cr`} />
    <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={28}>
      {data.map((_, i) => <Cell key={i} fill={`url(#${id}-${i % COLORS.length})`} />)}
      <LabelList dataKey="value" position="top" style={{ fontSize: 9, fill: "var(--primary)" }} /></Bar>
  </BarChart></ResponsiveContainer>;
}

function RankList({ data }: { data: { name: string; value: number }[] }) {
  if (!data.length) return <Empty />;
  const max = Math.max(...data.map((d) => d.value), 1);
  return <div className="text-[10px]"><p className="mb-1 text-right text-muted-foreground">₹ Cr</p>
    <ul className="space-y-1.5">{data.map((d) => <li key={d.name} className="grid grid-cols-[minmax(0,42%)_minmax(0,1fr)_auto] items-center gap-2" title={`${d.name}: ₹ ${cr(d.value)} Cr`}>
      <span className="truncate text-muted-foreground">{d.name}</span>
      <span className="h-2 rounded-full" style={{ width: `${Math.max(3, (d.value / max) * 100)}%`, background: "linear-gradient(90deg, color-mix(in oklab, var(--chart-2) 60%, transparent), var(--chart-2))" }} />
      <b className="text-right text-foreground">{cr(d.value).toFixed(2)}</b></li>)}</ul></div>;
}

function Donut({ data, total }: { data: { name: string; value: number }[]; total: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  if (!data.length) return <Empty />;
  return <div className="grid grid-cols-[minmax(0,140px)_minmax(0,1fr)] items-center gap-2">
    <div className="relative"><ResponsiveContainer width="100%" height={140}><PieChart>{grad(id)}
      <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={1} label={false} labelLine={false}>{data.map((_, i) => <Cell key={i} fill={`url(#${id}-${i % COLORS.length})`} />)}</Pie>
      <Tooltip formatter={(v: number) => `₹ ${cr(v)} Cr`} /></PieChart></ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center text-[10px] font-bold leading-tight text-foreground"><div>₹ {cr(total)} Cr<br /><span className="text-[8px] font-normal text-muted-foreground">Total Sales</span></div></div></div>
    <ul className="max-h-[140px] min-w-0 space-y-1 overflow-auto text-[10px]">{data.map((d, i) => <li key={d.name} className="flex min-w-0 items-center gap-1" title={d.name}><span className="size-2 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} /><span className="truncate">{d.name}</span> <b className="ml-auto shrink-0 pl-2">{total ? ((d.value / total) * 100).toFixed(1) : 0}%</b></li>)}</ul>
  </div>;
}

export function SalesRegisterDashboard({ rows = [], range }: { rows?: SalesRegisterRow[]; range?: SalesRegisterDateRange | undefined }) {
  const a = useMemo(() => buildSalesRegister(rows), [rows]);
  const trend = useMemo(() => salesRegisterTrend(rows, range), [rows, range]);
  const main = useMemo(() => summarizeGroupsByDivision(salesRegisterGroupRows(rows, "mainGroup"), (r) => r.name), [rows]);
  const sub = useMemo(() => summarizeGroupsByDivision(salesRegisterGroupRows(rows, "subGroup"), (r) => r.name), [rows]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const filtered = rows.filter((r) => !q || [r.customerName, r.invoiceNo, r.billingDocument, r.material].some((v) => v.toLowerCase().includes(q.toLowerCase())));
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const has = rows.length > 0;
  const sum = (k: "billedQty" | "netValue" | "invoiceValue" | "cgst" | "sgst" | "igst") => filtered.reduce((s, r) => s + r[k], 0);
  const channels = [...new Set(rows.map((r) => r.channelCode || r.channel))];
  const heads = ["#", "Bill. Date", "Bill. Doc. No", "Invoice No", "Customer Name", "Distribution Channel", "Plant", "Profit Center", "Main Group / Sub Group", "Material Description", "Billed Qty (LAH)", "Net Value (₹ Cr)", "CGST (LAH)", "SGST (LAH)", "IGST (LAH)", "Posting Status"];
  const R = "text-right tabular-nums whitespace-nowrap";

  return <div className="space-y-3">
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Tile icon={<IndianRupee className="size-5" />} label="Total Sales Count" value={has ? String(a.documents) : "—"} tone="var(--chart-1)" />
      <Tile icon={<FileText className="size-5" />} label="Total Net Value" value={has ? `₹ ${cr(a.totalNet).toFixed(2)} Cr` : "—"} tone="var(--chart-2)" />
      <Tile icon={<Users className="size-5" />} label="Unique Customers" value={has ? String(a.customers) : "—"} tone="var(--chart-4)" />
      <Tile icon={<Receipt className="size-5" />} label="Unique Billing Documents" value={has ? String(a.documents) : "—"} tone="var(--chart-3)" />
    </div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card title="Sales by Plant (Top 10)"><PlantColumns data={a.byPlant} /></Card>
      <Card title="Top 10 Customers"><RankList data={a.topCustomers} /></Card>
      <Card title="Sales by Main Group">{has ? <OrderBookSubGroupChart groups={main.groups} divisions={main.divisions} groupLabel="Main Group" /> : <Empty />}</Card>
      <Card title="Sales by Sub Group">{has ? <OrderBookSubGroupChart groups={sub.groups} divisions={sub.divisions} /> : <Empty />}</Card>
    </div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Card title="Distribution Channel"><Donut data={a.byChannel} total={a.totalInvoice} /></Card>
      <Card title={`Sales Register (${trend.granularity[0]!.toUpperCase()}${trend.granularity.slice(1)})`}>{trend.points.length ? <ResponsiveContainer width="100%" height={150}><BarChart data={trend.points.map((d) => ({ ...d, net: cr(d.net) }))} margin={{ top: 16, left: -16, right: 4, bottom: 0 }}>
        {grad("sr-trend")}<CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="name" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 9 }} /><Tooltip formatter={(v: number) => [`₹ ${v} Cr`, "Net Value"]} />
        <Bar dataKey="net" name="Net Value" radius={[3, 3, 0, 0]} maxBarSize={32}>{trend.points.map((_, i) => <Cell key={i} fill={`url(#sr-trend-${i % COLORS.length})`} />)}
          <LabelList dataKey="net" position="top" style={{ fontSize: 9, fill: "var(--primary)" }} /></Bar>
      </BarChart></ResponsiveContainer> : <Empty />}</Card>
      <Card title="Tax Breakdown">{a.tax.length ? <ResponsiveContainer width="100%" height={150}><BarChart data={a.tax.map((t) => ({ week: t.week, cgst: cr(t.cgst), sgst: cr(t.sgst), igst: cr(t.igst), tcs: cr(t.tcs) }))}>
        {grad("sr-tax")}<XAxis dataKey="week" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 9 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
        {["cgst", "sgst", "igst", "tcs"].map((k, i) => <Bar key={k} dataKey={k} name={k.toUpperCase()} stackId="t" fill={`url(#sr-tax-${i})`} />)}
      </BarChart></ResponsiveContainer> : <Empty />}</Card>
    </div>
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border px-3 py-2">
        <h2 className="flex min-w-0 items-center gap-2 truncate text-xs font-semibold"><BarChart3 className="size-4 shrink-0 text-primary" />Sales Register Details</h2>
        <div className="flex items-center gap-2">
          <button type="button" disabled={!filtered.length} onClick={() => void downloadSalesRegisterExcel(filtered)} className="inline-flex items-center gap-1 rounded border border-border bg-chart-2/10 px-2 py-1 text-xs font-semibold text-chart-2 disabled:opacity-40"><FileSpreadsheet className="size-3.5" />Excel</button>
          <div className="relative"><Search className="absolute left-2 top-2 size-3.5 text-muted-foreground" /><Input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search customer, invoice no, material..." className="h-8 w-56 pl-7 text-xs" /></div>
        </div>
      </div>
      <Table>
        <TableHeader className="bg-primary/5"><TableRow>{heads.map((h) => <TableHead key={h} className="h-9 whitespace-nowrap text-[10px] font-semibold text-primary">{h}</TableHead>)}</TableRow></TableHeader>
        <TableBody>{filtered.length ? filtered.slice(page * size, page * size + size).map((r, ri) => {
          const ch = r.channelCode || r.channel; const ci = Math.max(0, channels.indexOf(ch));
          return <TableRow key={r.billingDocument + r.invoiceNo + r.material + ri} className="text-[11px]">
            <TableCell>{page * size + ri + 1}</TableCell>
            <TableCell className="whitespace-nowrap">{r.billingDate}</TableCell>
            <TableCell className="whitespace-nowrap font-medium text-primary">{r.billingDocument}</TableCell>
            <TableCell className="whitespace-nowrap">{r.invoiceNo}</TableCell>
            <TableCell className="whitespace-nowrap">{r.customerName}</TableCell>
            <TableCell className="whitespace-nowrap font-medium"><span className="inline-flex items-center gap-1.5"><span className="size-2.5 shrink-0 rounded-sm" style={{ background: COLORS[ci % COLORS.length] }} />{r.channelCode && r.channel ? `${r.channelCode} — ${r.channel}` : r.channel || r.channelCode || "—"}</span></TableCell>
            <TableCell className="whitespace-nowrap">{[r.plant, r.descs?.["plantShort"] || r.descs?.["plant"]].filter(Boolean).join(" — ")}</TableCell>
            <TableCell className="whitespace-nowrap">{r.profitCenter}</TableCell>
            <TableCell className="whitespace-nowrap">{`${r.mainGroup} / ${r.subGroup}`}</TableCell>
            <TableCell className="min-w-56">{r.material}</TableCell>
            <TableCell className={R}>{toLah(r.billedQty).toFixed(2)}</TableCell>
            <TableCell className={R}>{toCr(r.netValue).toFixed(2)}</TableCell>
                        <TableCell className={R}>{toLah(r.cgst).toFixed(2)}</TableCell>
            <TableCell className={R}>{toLah(r.sgst).toFixed(2)}</TableCell>
            <TableCell className={R}>{toLah(r.igst).toFixed(2)}</TableCell>
            <TableCell><span className={`rounded px-2 py-0.5 ${r.status === "Posted" ? "bg-chart-2/15 font-semibold text-chart-2" : "bg-chart-4/20 font-semibold text-foreground"}`}>{r.status}</span></TableCell>
          </TableRow>;
        }) : <TableRow><TableCell colSpan={heads.length} className="h-24 text-center text-muted-foreground">No Sales Register data for these filters yet — run Sync in SAP API Settings.</TableCell></TableRow>}</TableBody>
        {filtered.length > 0 && <TableFooter><TableRow className="border-t-2 border-border bg-muted text-[11px] font-semibold">
          <TableCell colSpan={10}>Total ({filtered.length} lines)</TableCell>
          <TableCell className={R}>{toLah(sum("billedQty")).toFixed(2)}</TableCell>
          <TableCell className={R}>{toCr(sum("netValue")).toFixed(2)}</TableCell>
                    <TableCell className={R}>{toLah(sum("cgst")).toFixed(2)}</TableCell>
          <TableCell className={R}>{toLah(sum("sgst")).toFixed(2)}</TableCell>
          <TableCell className={R}>{toLah(sum("igst")).toFixed(2)}</TableCell>
          <TableCell />
        </TableRow></TableFooter>}
      </Table>
      <div className="flex flex-wrap items-center gap-2 border-t border-border px-3 py-2 text-xs">
        <span>Rows</span>
        <select value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }} className="rounded border border-border bg-background px-1 py-0.5">{[10, 25, 50].map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <span className="text-muted-foreground">Showing {filtered.length ? page * size + 1 : 0}–{Math.min(filtered.length, page * size + size)} of {filtered.length}</span>
        <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)} className="rounded border border-border px-2 py-0.5 disabled:opacity-40">Previous</button>
        <span>{page + 1} / {pages}</span>
        <button type="button" disabled={page >= pages - 1} onClick={() => setPage(page + 1)} className="rounded border border-border px-2 py-0.5 disabled:opacity-40">Next</button>
      </div>
    </section>
  </div>;
}
