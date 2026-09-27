import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, BookOpen, CircleDollarSign, Scale, Search, TableProperties } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Panel } from "@/components/report-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { aggregateZtbn, profitCentresFromColumns, type ZtbnColumn, type ZtbnGlSummary, type ZtbnRow } from "@/lib/ztbn";

function money(value: number) {
  const absolute = Math.abs(value);
  if (absolute >= 1e7) return `₹ ${(value / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Cr`;
  if (absolute >= 1e5) return `₹ ${(value / 1e5).toLocaleString("en-IN", { maximumFractionDigits: 2 })} L`;
  return `₹ ${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

const tooltipStyle = { borderColor: "var(--border)", borderRadius: 6, background: "var(--popover)", color: "var(--popover-foreground)", fontSize: 11 };

function Metric({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Scale; tone: string }) {
  return <div className="min-w-0 rounded-md border border-border bg-card p-3 shadow-tile">
    <div className="flex items-start justify-between gap-2"><p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p><span className={`grid size-8 shrink-0 place-items-center rounded-md ${tone}`}><Icon className="size-4" /></span></div>
    <p className="mt-3 truncate text-lg font-semibold tabular-nums text-foreground" title={value}>{value}</p>
  </div>;
}

function DetailDialog({ row, onClose }: { row: ZtbnGlSummary | null; onClose: () => void }) {
  return <Dialog open={Boolean(row)} onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent><DialogHeader><DialogTitle>{row?.glCode} · {row?.description}</DialogTitle><DialogDescription>Exact values contributing to this dashboard row.</DialogDescription></DialogHeader>
    {row ? <dl className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-md bg-muted p-3"><dt className="text-muted-foreground">Debit</dt><dd className="mt-1 font-semibold tabular-nums">{money(row.debit)}</dd></div><div className="rounded-md bg-muted p-3"><dt className="text-muted-foreground">Credit</dt><dd className="mt-1 font-semibold tabular-nums">{money(row.credit)}</dd></div><div className="rounded-md bg-muted p-3"><dt className="text-muted-foreground">Net balance</dt><dd className="mt-1 font-semibold tabular-nums">{money(row.net)}</dd></div><div className="rounded-md bg-muted p-3"><dt className="text-muted-foreground">Cumulative balance</dt><dd className="mt-1 font-semibold tabular-nums">{money(row.cumulativeBalance)}</dd></div></dl> : null}
  </DialogContent></Dialog>;
}

export function TbnDashboard({ rows, columns }: { rows: ZtbnRow[]; columns: ZtbnColumn[] }) {
  const profitCentres = useMemo(() => profitCentresFromColumns(columns), [columns]);
  const [profitCentre, setProfitCentre] = useState("all");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<ZtbnGlSummary | null>(null);
  const summary = useMemo(() => aggregateZtbn(rows, profitCentres, profitCentre, search), [rows, profitCentres, profitCentre, search]);
  const leadingCentres = [...summary.centres].sort((a, b) => Math.abs(b.net) - Math.abs(a.net)).slice(0, 8).map((item) => ({ ...item, short: item.label.split("/")[0] }));
  const topGl = [...summary.glRows].sort((a, b) => Math.abs(b.net) - Math.abs(a.net)).slice(0, 8);
  const composition = [{ name: "Debit", value: summary.totalDebit }, { name: "Credit", value: summary.totalCredit }];
  const zeroAccounts = summary.glRows.filter((row) => row.debit === 0 && row.credit === 0).length;
  const debitHeavy = summary.glRows.filter((row) => row.debit > row.credit).length;
  const creditHeavy = summary.glRows.filter((row) => row.credit > row.debit).length;
  const alerts = [
    { label: "High-value balances", value: topGl.filter((row) => Math.abs(row.net) >= Math.abs(topGl[0]?.net ?? 0) * .5).length, tone: "text-destructive" },
    { label: "Debit-heavy GLs", value: debitHeavy, tone: "text-primary" },
    { label: "Credit-heavy GLs", value: creditHeavy, tone: "text-success" },
    { label: "Zero-balance GLs", value: zeroAccounts, tone: "text-muted-foreground" },
  ];

  return <>
    <div className="mb-4 flex flex-col gap-3 rounded-md border border-primary/20 bg-accent/35 p-3 lg:flex-row lg:items-center lg:justify-between">
      <div><h2 className="text-lg font-semibold text-foreground">TBN Management Dashboard</h2><p className="text-xs text-muted-foreground">Live trial-balance intelligence from ZTBN</p></div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-64"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search GL code or description" className="bg-card pl-9" /></div>
        <Select value={profitCentre} onValueChange={setProfitCentre}><SelectTrigger className="min-w-64 bg-card"><SelectValue placeholder="All profit centres" /></SelectTrigger><SelectContent><SelectItem value="all">All profit centres</SelectItem>{profitCentres.map((centre) => <SelectItem key={centre.key} value={centre.key}>{centre.label}</SelectItem>)}</SelectContent></Select>
        <Button asChild variant="outline"><Link to="/reports/fi/tbn/table"><TableProperties className="size-4" />Full ZTBN Table</Link></Button>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <Metric label="Total Debit" value={money(summary.totalDebit)} icon={ArrowUpRight} tone="bg-primary/10 text-primary" />
      <Metric label="Total Credit" value={money(summary.totalCredit)} icon={ArrowDownRight} tone="bg-success/10 text-success" />
      <Metric label="Net Balance" value={money(summary.netBalance)} icon={Scale} tone="bg-warning/10 text-warning" />
      <Metric label="Cumulative Balance" value={money(summary.cumulativeBalance)} icon={CircleDollarSign} tone="bg-accent text-accent-foreground" />
      <Metric label="GL Accounts" value={summary.accountCount.toLocaleString("en-IN")} icon={BookOpen} tone="bg-muted text-foreground" />
    </div>

    <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-12">
      <Panel title="Debit vs Credit by Profit Centre" className="lg:col-span-5"><ResponsiveContainer width="100%" height={230}><BarChart data={leadingCentres} onClick={(state) => { const key = state?.activePayload?.[0]?.payload?.key; if (typeof key === "string") setProfitCentre(key); }} className="cursor-pointer"><CartesianGrid vertical={false} stroke="var(--chart-grid-line)" /><XAxis dataKey="short" tick={{ fontSize: 9 }} interval={0} angle={-18} height={48} /><YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v / 1e7).toFixed(0)}`} /><Tooltip contentStyle={tooltipStyle} formatter={(value: number) => money(value)} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="debit" name="Debit" fill="var(--kpi-1)" radius={[2, 2, 0, 0]} /><Bar dataKey="credit" name="Credit" fill="var(--kpi-2)" radius={[2, 2, 0, 0]} /></BarChart></ResponsiveContainer></Panel>
      <Panel title="Debit / Credit Composition" className="lg:col-span-3"><ResponsiveContainer width="100%" height={230}><PieChart><Pie data={composition} dataKey="value" nameKey="name" innerRadius="52%" outerRadius="78%"><Cell fill="var(--kpi-1)" /><Cell fill="var(--kpi-2)" /></Pie><Tooltip contentStyle={tooltipStyle} formatter={(value: number) => money(value)} /><Legend wrapperStyle={{ fontSize: 10 }} /></PieChart></ResponsiveContainer></Panel>
      <Panel title="Net Balance by Profit Centre" className="lg:col-span-4"><ResponsiveContainer width="100%" height={230}><BarChart data={leadingCentres} onClick={(state) => { const key = state?.activePayload?.[0]?.payload?.key; if (typeof key === "string") setProfitCentre(key); }} className="cursor-pointer"><CartesianGrid vertical={false} stroke="var(--chart-grid-line)" /><XAxis dataKey="short" tick={{ fontSize: 9 }} interval={0} angle={-18} height={48} /><YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v / 1e7).toFixed(0)}`} /><Tooltip contentStyle={tooltipStyle} formatter={(value: number) => money(value)} /><Bar dataKey="net" name="Net balance" radius={[2, 2, 0, 0]}>{leadingCentres.map((item) => <Cell key={item.key} fill={item.net >= 0 ? "var(--kpi-3)" : "var(--destructive)"} />)}</Bar></BarChart></ResponsiveContainer></Panel>
    </div>

    <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-12">
      <Panel title="Top GL Accounts by Balance" className="lg:col-span-4"><div className="space-y-2">{topGl.map((row) => { const width = Math.max(4, Math.abs(row.net) / Math.max(...topGl.map((item) => Math.abs(item.net)), 1) * 100); return <button key={row.id} type="button" onClick={() => setDetail(row)} className="w-full text-left"><div className="mb-1 flex justify-between gap-2 text-[10px]"><span className="truncate">{row.glCode} · {row.description}</span><span className="shrink-0 tabular-nums">{money(row.net)}</span></div><div className="h-2 overflow-hidden rounded-sm bg-muted"><div className="h-full rounded-sm bg-primary" style={{ width: `${width}%` }} /></div></button>; })}</div></Panel>
      <Panel title="Profit Centre Performance" className="lg:col-span-4"><div className="max-h-64 overflow-auto"><table className="w-full text-[10px]"><thead className="sticky top-0 bg-card"><tr className="border-b"><th className="py-2 text-left">Profit centre</th><th className="text-right">Debit</th><th className="text-right">Credit</th><th className="text-right">Net</th></tr></thead><tbody>{leadingCentres.map((item) => <tr key={item.key} className="border-b last:border-0"><td className="max-w-40 truncate py-2" title={item.label}>{item.short}</td><td className="text-right tabular-nums">{money(item.debit)}</td><td className="text-right tabular-nums">{money(item.credit)}</td><td className={`text-right font-medium tabular-nums ${item.net < 0 ? "text-destructive" : "text-success"}`}>{money(item.net)}</td></tr>)}</tbody></table></div></Panel>
      <Panel title="Leading GL Debit vs Credit" className="lg:col-span-4"><ResponsiveContainer width="100%" height={250}><BarChart data={topGl.slice(0, 6)} layout="vertical" margin={{ left: 8, right: 12 }}><XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v / 1e7).toFixed(0)}`} /><YAxis type="category" dataKey="glCode" width={70} tick={{ fontSize: 9 }} /><Tooltip contentStyle={tooltipStyle} formatter={(value: number) => money(value)} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="debit" name="Debit" fill="var(--kpi-1)" /><Bar dataKey="credit" name="Credit" fill="var(--kpi-2)" /></BarChart></ResponsiveContainer></Panel>
    </div>

    <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-12">
      <Panel title="Management Alerts" className="lg:col-span-4"><div className="grid grid-cols-2 gap-2">{alerts.map((alert) => <div key={alert.label} className="rounded-md border border-border bg-muted/35 p-3"><div className="flex items-center gap-2"><AlertTriangle className={`size-4 ${alert.tone}`} /><span className="text-[10px] text-muted-foreground">{alert.label}</span></div><p className={`mt-2 text-xl font-semibold ${alert.tone}`}>{alert.value.toLocaleString("en-IN")}</p></div>)}</div></Panel>
      <Panel title="Leading GL Entries" className="lg:col-span-8" actions={<span className="text-[10px] text-muted-foreground">Top balances</span>}><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-[10px]"><thead><tr className="border-b bg-muted/50"><th className="px-2 py-2 text-left">GL Account</th><th className="px-2 text-left">Description</th><th className="px-2 text-right">Debit</th><th className="px-2 text-right">Credit</th><th className="px-2 text-right">Net</th><th className="px-2 text-center">Action</th></tr></thead><tbody>{topGl.slice(0, 6).map((row) => <tr key={row.id} className="border-b last:border-0"><td className="px-2 py-2 font-medium">{row.glCode}</td><td className="max-w-52 truncate px-2" title={row.description}>{row.description}</td><td className="px-2 text-right tabular-nums">{money(row.debit)}</td><td className="px-2 text-right tabular-nums">{money(row.credit)}</td><td className={`px-2 text-right font-medium tabular-nums ${row.net < 0 ? "text-destructive" : "text-success"}`}>{money(row.net)}</td><td className="px-2 text-center"><Button type="button" variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => setDetail(row)}>View</Button></td></tr>)}</tbody></table></div></Panel>
    </div>
    <DetailDialog row={detail} onClose={() => setDetail(null)} />
  </>;
}