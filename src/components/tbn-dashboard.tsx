import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, BookOpen, CircleDollarSign, Filter, RotateCcw, Scale, Search, TableProperties } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Panel } from "@/components/report-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/multi-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { aggregateZtbn, profitCentresFromColumns, type ZtbnBalanceType, type ZtbnColumn, type ZtbnGlSummary, type ZtbnRow } from "@/lib/ztbn";

function money(value: number) {
  const absolute = Math.abs(value);
  if (absolute >= 1e7) return `₹ ${(value / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Cr`;
  if (absolute >= 1e5) return `₹ ${(value / 1e5).toLocaleString("en-IN", { maximumFractionDigits: 2 })} L`;
  return `₹ ${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

const tooltipStyle = { borderColor: "var(--border)", borderRadius: 6, background: "var(--popover)", color: "var(--popover-foreground)", fontSize: 11 };

function Metric({ label, value, icon: Icon, cardTone, iconTone }: { label: string; value: string; icon: typeof Scale; cardTone: string; iconTone: string }) {
  return <div className={`min-w-0 rounded-md border p-3 shadow-tile transition-shadow hover:shadow-tile-hover ${cardTone}`}>
    <div className="flex items-start justify-between gap-2"><p className="text-[10px] font-semibold uppercase text-foreground/70">{label}</p><span className={`grid size-8 shrink-0 place-items-center rounded-md ${iconTone}`}><Icon className="size-4" /></span></div>
    <p className="mt-3 truncate text-lg font-semibold tabular-nums text-foreground" title={value}>{value}</p>
  </div>;
}

function DetailDialog({ row, onClose }: { row: ZtbnGlSummary | null; onClose: () => void }) {
  return <Dialog open={Boolean(row)} onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent><DialogHeader><DialogTitle>{row?.glCode} · {row?.description}</DialogTitle><DialogDescription>Exact values contributing to this dashboard row.</DialogDescription></DialogHeader>
    {row ? <dl className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-md border border-primary/30 bg-primary/10 p-3"><dt className="text-primary">Debit</dt><dd className="mt-1 font-semibold tabular-nums text-foreground">{money(row.debit)}</dd></div><div className="rounded-md border border-success/30 bg-success/10 p-3"><dt className="text-success">Credit</dt><dd className="mt-1 font-semibold tabular-nums text-foreground">{money(row.credit)}</dd></div><div className="rounded-md border border-warning/35 bg-warning/15 p-3"><dt className="text-warning-foreground">Net balance</dt><dd className={`mt-1 font-semibold tabular-nums ${row.net < 0 ? "text-destructive" : "text-success"}`}>{money(row.net)}</dd></div><div className="rounded-md border border-accent-foreground/25 bg-accent p-3"><dt className="text-accent-foreground">Cumulative balance</dt><dd className="mt-1 font-semibold tabular-nums text-foreground">{money(row.cumulativeBalance)}</dd></div></dl> : null}
  </DialogContent></Dialog>;
}

export function TbnDashboard({ rows, columns }: { rows: ZtbnRow[]; columns: ZtbnColumn[] }) {
  const profitCentres = useMemo(() => profitCentresFromColumns(columns), [columns]);
  const [selectedProfitCentres, setSelectedProfitCentres] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [balanceType, setBalanceType] = useState<ZtbnBalanceType>("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [detail, setDetail] = useState<ZtbnGlSummary | null>(null);
  const parsedMin = minAmount === "" ? null : Number(minAmount);
  const parsedMax = maxAmount === "" ? null : Number(maxAmount);
  const summary = useMemo(() => aggregateZtbn(rows, profitCentres, selectedProfitCentres, search, balanceType, Number.isFinite(parsedMin) ? parsedMin : null, Number.isFinite(parsedMax) ? parsedMax : null), [rows, profitCentres, selectedProfitCentres, search, balanceType, parsedMin, parsedMax]);
  const activeFilterCount = Number(selectedProfitCentres.length > 0) + Number(Boolean(search.trim())) + Number(balanceType !== "all") + Number(minAmount !== "") + Number(maxAmount !== "");
  const resetFilters = () => {
    setSelectedProfitCentres([]);
    setSearch("");
    setBalanceType("all");
    setMinAmount("");
    setMaxAmount("");
  };
  const leadingCentres = [...summary.centres].sort((a, b) => Math.abs(b.net) - Math.abs(a.net)).slice(0, 8).map((item) => ({ ...item, short: item.label.split("/")[0] }));
  const topGl = [...summary.glRows].sort((a, b) => Math.abs(b.net) - Math.abs(a.net)).slice(0, 8);
  const composition = [{ name: "Debit", value: summary.totalDebit }, { name: "Credit", value: summary.totalCredit }];
  const zeroAccounts = summary.glRows.filter((row) => row.debit === 0 && row.credit === 0).length;
  const debitHeavy = summary.glRows.filter((row) => row.debit > row.credit).length;
  const creditHeavy = summary.glRows.filter((row) => row.credit > row.debit).length;
  const alerts = [
    { label: "High-value balances", value: topGl.filter((row) => Math.abs(row.net) >= Math.abs(topGl[0]?.net ?? 0) * .5).length, tone: "text-destructive", surface: "border-destructive/30 bg-destructive/10" },
    { label: "Debit-heavy GLs", value: debitHeavy, tone: "text-primary", surface: "border-primary/30 bg-primary/10" },
    { label: "Credit-heavy GLs", value: creditHeavy, tone: "text-success", surface: "border-success/30 bg-success/10" },
    { label: "Zero-balance GLs", value: zeroAccounts, tone: "text-muted-foreground", surface: "border-border bg-secondary" },
  ];

  return <>
    <div className="mb-4 rounded-md border border-primary/20 bg-accent/35">
      <div className="flex flex-col gap-3 border-b border-primary/15 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-lg font-semibold text-foreground">TBN Management Dashboard</h2><p className="text-xs text-muted-foreground">Live trial-balance intelligence from ZTBN</p></div>
        <Button asChild variant="outline"><Link to="/reports/fi/tbn/table"><TableProperties className="size-4" />Full ZTBN Table</Link></Button>
      </div>
      <div className="p-3">
        <div className="mb-2 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Filter className="size-4 text-primary" /><span className="text-sm font-semibold text-foreground">Filters</span>{activeFilterCount > 0 ? <span className="rounded-sm border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{activeFilterCount} active</span> : null}</div><Button type="button" variant="ghost" size="sm" onClick={resetFilters} disabled={activeFilterCount === 0}><RotateCcw className="size-3.5" />Reset</Button></div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
          <div><label className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">Profit Centre</label><MultiSelect options={profitCentres.map((centre) => ({ value: centre.key, label: centre.label }))} selected={selectedProfitCentres} onChange={setSelectedProfitCentres} placeholder="All profit centres" /></div>
          <div><label className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">GL Account</label><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Code or description" className="bg-card pl-9" /></div></div>
          <div><label className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">Balance Type</label><Select value={balanceType} onValueChange={(value) => setBalanceType(value as ZtbnBalanceType)}><SelectTrigger className="w-full bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All balances</SelectItem><SelectItem value="debit">Debit-heavy</SelectItem><SelectItem value="credit">Credit-heavy</SelectItem><SelectItem value="zero">Zero balance</SelectItem></SelectContent></Select></div>
          <div><label htmlFor="tbn-min-amount" className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">Minimum absolute balance</label><Input id="tbn-min-amount" type="number" min="0" value={minAmount} onChange={(event) => setMinAmount(event.target.value)} placeholder="No minimum" className="bg-card" /></div>
          <div><label htmlFor="tbn-max-amount" className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">Maximum absolute balance</label><Input id="tbn-max-amount" type="number" min="0" value={maxAmount} onChange={(event) => setMaxAmount(event.target.value)} placeholder="No maximum" className="bg-card" /></div>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">Date, monthly, quarterly, company, and plant filters will become available when those fields are supplied in ZTBN.</p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <Metric label="Total Debit" value={money(summary.totalDebit)} icon={ArrowUpRight} cardTone="border-primary/30 bg-primary/10" iconTone="bg-primary/15 text-primary" />
      <Metric label="Total Credit" value={money(summary.totalCredit)} icon={ArrowDownRight} cardTone="border-success/30 bg-success/10" iconTone="bg-success/15 text-success" />
      <Metric label="Net Balance" value={money(summary.netBalance)} icon={Scale} cardTone="border-warning/35 bg-warning/15" iconTone="bg-warning/20 text-warning-foreground" />
      <Metric label="Cumulative Balance" value={money(summary.cumulativeBalance)} icon={CircleDollarSign} cardTone="border-accent-foreground/25 bg-accent" iconTone="bg-accent-foreground/10 text-accent-foreground" />
      <Metric label="GL Accounts" value={summary.accountCount.toLocaleString("en-IN")} icon={BookOpen} cardTone="border-border bg-secondary" iconTone="bg-foreground/10 text-foreground" />
    </div>

    {summary.accountCount === 0 ? <div className="mt-3 rounded-md border border-dashed border-border bg-muted/25 px-4 py-8 text-center text-sm text-muted-foreground">No GL accounts match the selected filters.</div> : null}

    <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-12">
      <Panel title="Debit vs Credit by Profit Centre" className="border-primary/20 bg-primary/5 lg:col-span-5"><ResponsiveContainer width="100%" height={230}><BarChart data={leadingCentres} onClick={(state) => { const key = state?.activePayload?.[0]?.payload?.key; if (typeof key === "string") setSelectedProfitCentres([key]); }} className="cursor-pointer"><CartesianGrid vertical={false} stroke="var(--chart-grid-line)" /><XAxis dataKey="short" tick={{ fontSize: 9 }} interval={0} angle={-18} height={48} /><YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v / 1e7).toFixed(0)}`} /><Tooltip contentStyle={tooltipStyle} formatter={(value: number) => money(value)} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="debit" name="Debit" fill="var(--primary)" radius={[2, 2, 0, 0]} /><Bar dataKey="credit" name="Credit" fill="var(--success)" radius={[2, 2, 0, 0]} /></BarChart></ResponsiveContainer></Panel>
      <Panel title="Debit / Credit Composition" className="border-success/20 bg-success/5 lg:col-span-3"><ResponsiveContainer width="100%" height={230}><PieChart><Pie data={composition} dataKey="value" nameKey="name" innerRadius="52%" outerRadius="78%"><Cell fill="var(--primary)" /><Cell fill="var(--success)" /></Pie><Tooltip contentStyle={tooltipStyle} formatter={(value: number) => money(value)} /><Legend wrapperStyle={{ fontSize: 10 }} /></PieChart></ResponsiveContainer></Panel>
      <Panel title="Net Balance by Profit Centre" className="border-warning/25 bg-warning/5 lg:col-span-4"><ResponsiveContainer width="100%" height={230}><BarChart data={leadingCentres} onClick={(state) => { const key = state?.activePayload?.[0]?.payload?.key; if (typeof key === "string") setSelectedProfitCentres([key]); }} className="cursor-pointer"><CartesianGrid vertical={false} stroke="var(--chart-grid-line)" /><XAxis dataKey="short" tick={{ fontSize: 9 }} interval={0} angle={-18} height={48} /><YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v / 1e7).toFixed(0)}`} /><Tooltip contentStyle={tooltipStyle} formatter={(value: number) => money(value)} /><Bar dataKey="net" name="Net balance" radius={[2, 2, 0, 0]}>{leadingCentres.map((item) => <Cell key={item.key} fill={item.net >= 0 ? "var(--success)" : "var(--destructive)"} />)}</Bar></BarChart></ResponsiveContainer></Panel>
    </div>

    <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-12">
      <Panel title="Top GL Accounts by Balance" className="lg:col-span-4"><div className="space-y-2">{topGl.map((row) => { const width = Math.max(4, Math.abs(row.net) / Math.max(...topGl.map((item) => Math.abs(item.net)), 1) * 100); return <button key={row.id} type="button" onClick={() => setDetail(row)} className="w-full text-left"><div className="mb-1 flex justify-between gap-2 text-[10px]"><span className="truncate">{row.glCode} · {row.description}</span><span className="shrink-0 tabular-nums">{money(row.net)}</span></div><div className="h-2 overflow-hidden rounded-sm bg-muted"><div className="h-full rounded-sm bg-primary" style={{ width: `${width}%` }} /></div></button>; })}</div></Panel>
      <Panel title="Profit Centre Performance" className="lg:col-span-4"><div className="max-h-64 overflow-auto"><table className="w-full text-[10px]"><thead className="sticky top-0 bg-card"><tr className="border-b"><th className="py-2 text-left">Profit centre</th><th className="text-right">Debit</th><th className="text-right">Credit</th><th className="text-right">Net</th></tr></thead><tbody>{leadingCentres.map((item) => <tr key={item.key} className="border-b last:border-0"><td className="max-w-40 truncate py-2" title={item.label}>{item.short}</td><td className="text-right tabular-nums">{money(item.debit)}</td><td className="text-right tabular-nums">{money(item.credit)}</td><td className={`text-right font-medium tabular-nums ${item.net < 0 ? "text-destructive" : "text-success"}`}>{money(item.net)}</td></tr>)}</tbody></table></div></Panel>
      <Panel title="Leading GL Debit vs Credit" className="lg:col-span-4"><ResponsiveContainer width="100%" height={250}><BarChart data={topGl.slice(0, 6)} layout="vertical" margin={{ left: 8, right: 12 }}><XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v / 1e7).toFixed(0)}`} /><YAxis type="category" dataKey="glCode" width={70} tick={{ fontSize: 9 }} /><Tooltip contentStyle={tooltipStyle} formatter={(value: number) => money(value)} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="debit" name="Debit" fill="var(--kpi-1)" /><Bar dataKey="credit" name="Credit" fill="var(--kpi-2)" /></BarChart></ResponsiveContainer></Panel>
    </div>

    <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-12">
      <Panel title="Management Alerts" className="border-warning/20 bg-warning/5 lg:col-span-4"><div className="grid grid-cols-2 gap-2">{alerts.map((alert) => <div key={alert.label} className={`rounded-md border p-3 ${alert.surface}`}><div className="flex items-center gap-2"><AlertTriangle className={`size-4 ${alert.tone}`} /><span className="text-[10px] text-foreground/70">{alert.label}</span></div><p className={`mt-2 text-xl font-semibold ${alert.tone}`}>{alert.value.toLocaleString("en-IN")}</p></div>)}</div></Panel>
      <Panel title="Leading GL Entries" className="border-accent-foreground/20 bg-accent/30 lg:col-span-8" actions={<span className="text-[10px] text-muted-foreground">Top balances</span>}><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-[10px]"><thead><tr className="border-b border-accent-foreground/20 bg-accent"><th className="px-2 py-2 text-left">GL Account</th><th className="px-2 text-left">Description</th><th className="px-2 text-right text-primary">Debit</th><th className="px-2 text-right text-success">Credit</th><th className="px-2 text-right text-warning-foreground">Net</th><th className="px-2 text-center">Action</th></tr></thead><tbody>{topGl.slice(0, 6).map((row) => <tr key={row.id} className="border-b transition-colors hover:bg-accent/70 last:border-0"><td className="px-2 py-2 font-medium">{row.glCode}</td><td className="max-w-52 truncate px-2" title={row.description}>{row.description}</td><td className="bg-primary/5 px-2 text-right tabular-nums text-primary">{money(row.debit)}</td><td className="bg-success/5 px-2 text-right tabular-nums text-success">{money(row.credit)}</td><td className={`bg-warning/5 px-2 text-right font-medium tabular-nums ${row.net < 0 ? "text-destructive" : "text-success"}`}>{money(row.net)}</td><td className="px-2 text-center"><Button type="button" variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => setDetail(row)}>View</Button></td></tr>)}</tbody></table></div></Panel>
    </div>
    <DetailDialog row={detail} onClose={() => setDetail(null)} />
  </>;
}