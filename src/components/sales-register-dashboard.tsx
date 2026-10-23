import { useMemo, useState, type ReactNode } from "react";
import { FileText, IndianRupee, Receipt, Search, Users, BarChart3 } from "lucide-react";
import { Bar, BarChart, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Input } from "@/components/ui/input";
import { buildSalesRegister, type SalesRegisterRow } from "@/lib/sales-register";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--primary)"];
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

function HBars({ data }: { data: { name: string; value: number }[] }) {
  if (!data.length) return <Empty />;
  return <ResponsiveContainer width="100%" height={150}><BarChart layout="vertical" data={data.map((d) => ({ ...d, value: cr(d.value) }))} margin={{ left: 0, right: 40 }}>
    <XAxis type="number" tick={{ fontSize: 9 }} /><YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 9 }} />
    <Tooltip formatter={(v: number) => `₹ ${v} Cr`} />
    <Bar dataKey="value" radius={[0, 3, 3, 0]} label={{ position: "right", fontSize: 9, formatter: (v: number) => `₹ ${v} Cr` }}>
      {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
  </BarChart></ResponsiveContainer>;
}

function Donut({ data, total }: { data: { name: string; value: number }[]; total: number }) {
  if (!data.length) return <Empty />;
  return <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
    <div className="relative"><ResponsiveContainer width="100%" height={140}><PieChart>
      <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="90%">{data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie>
      <Tooltip formatter={(v: number) => `₹ ${cr(v)} Cr`} /></PieChart></ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center text-xs font-bold text-foreground">₹ {cr(total)} Cr<br /><span className="text-[9px] font-normal text-muted-foreground">Total Sales</span></div></div>
    <ul className="space-y-1 text-[10px]">{data.map((d, i) => <li key={d.name} className="flex items-center gap-1"><span className="size-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{d.name} <b className="ml-auto pl-2">{total ? ((d.value / total) * 100).toFixed(1) : 0}%</b></li>)}</ul>
  </div>;
}

export function SalesRegisterDashboard({ rows = [] }: { rows?: SalesRegisterRow[] }) {
  const a = useMemo(() => buildSalesRegister(rows), [rows]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const filtered = rows.filter((r) => !q || [r.customerName, r.invoiceNo, r.billingDocument, r.material].some((v) => v.toLowerCase().includes(q.toLowerCase())));
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const has = rows.length > 0;
  const heads = ["Bill. Date", "Bill. Doc. No", "Invoice No", "Customer Name", "Plant", "Profit Center", "Main Group / Sub Group", "Material Description", "Billed Qty", "Net Value (₹)", "Total Invoice Value (₹)", "CGST (₹)", "SGST (₹)", "IGST (₹)", "Posting Status"];

  return <div className="space-y-3">
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Tile icon={<IndianRupee className="size-5" />} label="Total Invoice Value" value={has ? `₹ ${cr(a.totalInvoice).toFixed(2)} Cr` : "—"} tone="var(--chart-1)" />
      <Tile icon={<FileText className="size-5" />} label="Total Net Value" value={has ? `₹ ${cr(a.totalNet).toFixed(2)} Cr` : "—"} tone="var(--chart-2)" />
      <Tile icon={<Users className="size-5" />} label="Unique Customers" value={has ? String(a.customers) : "—"} tone="var(--chart-4)" />
      <Tile icon={<Receipt className="size-5" />} label="Unique Billing Documents" value={has ? String(a.documents) : "—"} tone="var(--chart-3)" />
    </div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card title="Sales by Plant (Top 10)"><HBars data={a.byPlant} /></Card>
      <Card title="Top 10 Customers"><HBars data={a.topCustomers} /></Card>
      <Card title="Sales by Main Group"><Donut data={a.byMainGroup} total={a.totalInvoice} /></Card>
      <Card title="Distribution Channel"><Donut data={a.byChannel} total={a.totalInvoice} /></Card>
    </div>
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <Card title="Sales Register (Daily)">{a.daily.length ? <ResponsiveContainer width="100%" height={150}><ComposedChart data={a.daily.map((d) => ({ ...d, invoice: cr(d.invoice), net: cr(d.net) }))}>
        <XAxis dataKey="date" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 9 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
        <Bar dataKey="invoice" name="Invoice Value" fill="var(--chart-1)" /><Line dataKey="net" name="Net Value" stroke="var(--chart-2)" />
      </ComposedChart></ResponsiveContainer> : <Empty />}</Card>
      <Card title="Tax Breakdown">{a.tax.length ? <ResponsiveContainer width="100%" height={150}><BarChart data={a.tax.map((t) => ({ week: t.week, cgst: cr(t.cgst), sgst: cr(t.sgst), igst: cr(t.igst), tcs: cr(t.tcs) }))}>
        <XAxis dataKey="week" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 9 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
        {["cgst", "sgst", "igst", "tcs"].map((k, i) => <Bar key={k} dataKey={k} name={k.toUpperCase()} stackId="t" fill={COLORS[i]} />)}
      </BarChart></ResponsiveContainer> : <Empty />}</Card>
      <Card title="Sales by Product Category"><HBars data={a.byCategory} /></Card>
    </div>
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border px-3 py-2">
        <h2 className="flex min-w-0 items-center gap-2 truncate text-xs font-semibold"><BarChart3 className="size-4 shrink-0 text-primary" />Sales Register Details</h2>
        <div className="flex items-center gap-2">
          <div className="relative"><Search className="absolute left-2 top-2 size-3.5 text-muted-foreground" /><Input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search customer, invoice no, material..." className="h-8 w-56 pl-7 text-xs" /></div>
          <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)} className="rounded border border-border px-2 py-1 text-xs disabled:opacity-40">‹</button>
          <span className="text-xs">{page + 1} / {pages}</span>
          <button type="button" disabled={page >= pages - 1} onClick={() => setPage(page + 1)} className="rounded border border-border px-2 py-1 text-xs disabled:opacity-40">›</button>
        </div>
      </div>
      <div className="max-h-[320px] overflow-auto">
        <table className="w-full text-[11px]"><thead className="sticky top-0 bg-muted"><tr>{heads.map((h) => <th key={h} className="whitespace-nowrap px-2 py-1.5 text-left font-semibold">{h}</th>)}</tr></thead>
          <tbody>{filtered.length ? filtered.slice(page * 10, page * 10 + 10).map((r) => <tr key={r.billingDocument + r.invoiceNo + r.material} className="border-t border-border">
            {[r.billingDate, r.billingDocument, r.invoiceNo, r.customerName, r.plant, r.profitCenter, `${r.mainGroup} / ${r.subGroup}`, r.material, r.billedQty.toFixed(3), inr(r.netValue), inr(r.invoiceValue), inr(r.cgst), inr(r.sgst), inr(r.igst)].map((v, i) => <td key={i} className="whitespace-nowrap px-2 py-1.5">{v}</td>)}
            <td className="px-2 py-1.5"><span className={`rounded px-2 py-0.5 ${r.status === "Posted" ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"}`}>{r.status}</span></td>
          </tr>) : <tr><td colSpan={heads.length} className="py-8 text-center text-muted-foreground">No Sales Register data for these filters yet — run Sync in SAP API Settings.</td></tr>}</tbody></table>
      </div>
    </section>
  </div>;
}
