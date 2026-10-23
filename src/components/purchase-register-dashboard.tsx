import { useId, useMemo, useState, type ReactNode } from "react";
import { Factory, Globe2, IndianRupee, Truck, Wrench } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import {
  MATERIAL_GROUPS, MONTHS, PLANTS, PROFIT_CENTERS, PURCHASE_TYPES, QUARTERS, TOP_MATERIALS, TOP_VENDORS, TOTAL_PURCHASE, TYPE_TOTALS,
  monthlyRows, quarterlyYoy, sumValues, type PurchaseType,
} from "@/lib/purchase-register-sample";

const COLORS = ["#1f6fd1", "#0f9d8a", "#2e8b57", "#e08a1e", "#8e44ad", "#d64550", "#3a8dde", "#16a3b8", "#c0841a", "#5c6bc0"];
const TYPE_COLOR: Record<PurchaseType, number> = { Domestic: 0, Imported: 3, Service: 4 };
const fmt = (v: number) => v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Card({ title, sub, children, className = "" }: { title: string; sub?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`flex min-w-0 flex-col rounded-xl border border-border bg-card p-2 shadow-sm ${className}`}>
    <div className="mb-1 flex items-center justify-between gap-2"><h2 className="text-xs font-semibold text-card-foreground">{title}</h2>{sub ? <span className="text-[10px] text-muted-foreground">{sub}</span> : null}</div>
    <div className="min-h-0 flex-1">{children}</div>
  </section>;
}

function Tile({ icon, label, value, note, tone }: { icon: ReactNode; label: string; value: string; note?: string; tone: string }) {
  return <div className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-sm" style={{ backgroundImage: `linear-gradient(135deg, color-mix(in oklab, ${tone} 12%, transparent), transparent)` }}>
    <div className="grid size-8 shrink-0 place-items-center rounded-full text-primary-foreground" style={{ background: tone }}>{icon}</div>
    <div className="min-w-0"><p className="truncate text-xs font-semibold text-foreground">{label}</p>
      <p className="truncate text-lg font-bold text-foreground">{value}</p>{note ? <p className="truncate text-[10px] text-muted-foreground">{note}</p> : null}</div>
  </div>;
}

function grad(id: string) {
  return <defs>{COLORS.map((c, i) => <linearGradient key={i} id={`${id}-${i}`} x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" style={{ stopColor: c, stopOpacity: 0.55 }} /><stop offset="55%" style={{ stopColor: c, stopOpacity: 0.9 }} /><stop offset="100%" style={{ stopColor: c, stopOpacity: 1 }} /></linearGradient>)}</defs>;
}

function Columns({ data, height = 170 }: { data: { name: string; value: number }[]; height?: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return <ResponsiveContainer width="100%" height={height}><BarChart data={data} margin={{ top: 16, left: -16, right: 4, bottom: 0 }}>{grad(id)}
    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
    <XAxis dataKey="name" interval={0} tick={{ fontSize: 9, fontWeight: 600 }} /><YAxis tick={{ fontSize: 9 }} /><Tooltip formatter={(v: number) => `₹ ${fmt(v)} Cr`} />
    <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={28}>{data.map((_, i) => <Cell key={i} fill={`url(#${id}-${i % COLORS.length})`} />)}
      <LabelList dataKey="value" position="top" formatter={(v: number) => Math.round(v)} style={{ fontSize: 9, fill: "var(--primary)" }} /></Bar>
  </BarChart></ResponsiveContainer>;
}

function RankList({ data }: { data: { name: string; code?: string; extra?: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return <div className="text-[10px]"><p className="mb-1 text-right text-muted-foreground">₹ Cr</p>
    <ul className="space-y-1.5">{data.map((d, i) => <li key={d.name + i} className="grid grid-cols-[minmax(0,45%)_minmax(0,1fr)_auto] items-center gap-2" title={`${d.name}${d.code ? ` (${d.code})` : ""}: ₹ ${fmt(d.value)} Cr`}>
      <span className="min-w-0"><span className="block truncate text-foreground">{d.name}</span>{d.code || d.extra ? <span className="block truncate text-[9px] text-muted-foreground">{[d.code, d.extra].filter(Boolean).join(" · ")}</span> : null}</span>
      <span className="h-2 rounded-full" style={{ width: `${Math.max(3, (d.value / max) * 100)}%`, background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}99, ${COLORS[i % COLORS.length]})` }} />
      <b className="text-right text-foreground">{fmt(d.value)}</b></li>)}</ul></div>;
}

function CodeTable({ rows, codeLabel }: { rows: { code: string; name: string; value: number }[]; codeLabel: string }) {
  return <table className="w-full text-[10px]"><thead className="bg-primary/5 text-primary"><tr><th className="px-1.5 py-1 text-left">{codeLabel}</th><th className="px-1.5 py-1 text-left">Name</th><th className="px-1.5 py-1 text-right">Amount (₹ Cr)</th></tr></thead>
    <tbody>{rows.map((r, i) => <tr key={r.code} className="border-t border-border/60"><td className="px-1.5 py-0.5 font-medium text-primary"><span className="mr-1 inline-block size-2 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />{r.code}</td><td className="truncate px-1.5 py-0.5">{r.name}</td><td className="px-1.5 py-0.5 text-right tabular-nums">{fmt(r.value)}</td></tr>)}</tbody>
    <tfoot><tr className="border-t-2 border-border bg-muted font-semibold"><td className="px-1.5 py-1" colSpan={2}>Total</td><td className="px-1.5 py-1 text-right tabular-nums">{fmt(sumValues(rows))}</td></tr></tfoot></table>;
}

const sel = "h-8 rounded-md border border-border bg-background px-2 text-xs";

export function PurchaseRegisterDashboard() {
  const [type, setType] = useState<"" | PurchaseType>("");
  const [month, setMonth] = useState("");
  const [plant, setPlant] = useState("");
  const [group, setGroup] = useState("");
  const types = type ? [type] : PURCHASE_TYPES;
  const monthly = useMemo(() => monthlyRows(types, month || null), [type, month]); // eslint-disable-line react-hooks/exhaustive-deps
  const plants = plant ? PLANTS.filter((p) => p.code === plant) : PLANTS;
  const groups = group ? MATERIAL_GROUPS.filter((g) => g.name === group) : MATERIAL_GROUPS;
  const materials = group ? TOP_MATERIALS.filter((m) => m.group === group) : TOP_MATERIALS;
  const typeData = types.map((t) => ({ name: t, value: TYPE_TOTALS[t] }));
  const total = type ? TYPE_TOTALS[type] : TOTAL_PURCHASE;
  const yoy = quarterlyYoy();
  const pct = (v: number) => `${((v / TOTAL_PURCHASE) * 100).toFixed(1)}% of total`;
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");

  return <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-sm">
      <span className="text-[10px] font-bold tracking-wide text-primary uppercase">Filters</span>
      <select className={sel} value="2026-27" disabled aria-label="Year"><option>2026-27</option></select>
      <select className={sel} value={plant} onChange={(e) => setPlant(e.target.value)} aria-label="Plant"><option value="">All Plants</option>{PLANTS.map((p) => <option key={p.code} value={p.code}>{p.code} — {p.name}</option>)}</select>
      <select className={sel} value={type} onChange={(e) => setType(e.target.value as "" | PurchaseType)} aria-label="Type"><option value="">All Types</option>{PURCHASE_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
      <select className={sel} value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Material Group"><option value="">All Material Groups</option>{MATERIAL_GROUPS.map((g) => <option key={g.name}>{g.name}</option>)}</select>
      <select className={sel} value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Month"><option value="">All Months</option>{MONTHS.map((m) => <option key={m}>{m}</option>)}</select>
      <Button type="button" variant="reset" size="sm" className="h-8 text-xs" onClick={() => { setType(""); setMonth(""); setPlant(""); setGroup(""); }}>Reset</Button>
      <span className="ml-auto rounded-full bg-chart-4/20 px-2 py-0.5 text-[10px] font-semibold text-foreground">Sample data · ₹ values in Crores</span>
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Tile icon={<IndianRupee className="size-5" />} label="Total Purchase Value" value={`₹ ${fmt(total)} Cr`} tone="var(--chart-1)" />
      <Tile icon={<Truck className="size-5" />} label="Domestic" value={`₹ ${fmt(TYPE_TOTALS.Domestic)} Cr`} note={pct(TYPE_TOTALS.Domestic)} tone="var(--chart-2)" />
      <Tile icon={<Globe2 className="size-5" />} label="Imported" value={`₹ ${fmt(TYPE_TOTALS.Imported)} Cr`} note={pct(TYPE_TOTALS.Imported)} tone="var(--chart-4)" />
      <Tile icon={<Wrench className="size-5" />} label="Service" value={`₹ ${fmt(TYPE_TOTALS.Service)} Cr`} note={pct(TYPE_TOTALS.Service)} tone="var(--chart-3)" />
    </div>

    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
      <Card title="Purchase Trend" sub="Monthly · ₹ Cr"><Columns data={monthly.map((r) => ({ name: r.month, value: r.total }))} /></Card>
      <Card title="Purchase by Type" sub="Click to filter">
        <div className="grid grid-cols-[minmax(0,140px)_minmax(0,1fr)] items-center gap-2">
          <div className="relative"><ResponsiveContainer width="100%" height={150}><PieChart>{grad(id)}
            <Pie data={typeData.filter((d) => d.value > 0)} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={1} onClick={(d: { name: PurchaseType }) => setType(type === d.name ? "" : d.name)}>
              {typeData.filter((d) => d.value > 0).map((d) => <Cell key={d.name} className="cursor-pointer" fill={`url(#${id}-${TYPE_COLOR[d.name]})`} />)}</Pie>
            <Tooltip formatter={(v: number) => `₹ ${fmt(v)} Cr`} /></PieChart></ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center text-[10px] font-bold leading-tight">₹ {Math.round(total).toLocaleString("en-IN")} Cr</div></div>
          <ul className="space-y-1 text-[10px]">{typeData.map((d) => <li key={d.name}><button type="button" onClick={() => setType(type === d.name ? "" : d.name)} className="flex w-full items-center gap-1 text-left"><span className="size-2 rounded-full" style={{ background: COLORS[TYPE_COLOR[d.name]] }} />{d.name}<b className="ml-auto">{fmt(d.value)}</b></button></li>)}</ul>
        </div>
      </Card>
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Card title="Top 10 Materials"><RankList data={materials.map((m) => ({ name: m.name, code: m.code, extra: m.group, value: m.value }))} /></Card>
      <Card title="Top 10 Vendors"><RankList data={TOP_VENDORS} /></Card>
      <Card title="Material Group"><RankList data={groups} /></Card>
    </div>

    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <Card title="Monthly Expenditure" sub="Amount in ₹ Cr"><ResponsiveContainer width="100%" height={180}><BarChart data={monthly} margin={{ top: 8, left: -16, right: 4, bottom: 0 }}>{grad(`${id}m`)}
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="month" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 9 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
        {types.map((t) => <Bar key={t} dataKey={t} stackId="m" fill={`url(#${id}m-${TYPE_COLOR[t]})`} />)}
      </BarChart></ResponsiveContainer></Card>
      <Card title="Quarterly Comparison" sub={<span>2026-27 vs 2025-26 · <b className={yoy < 0 ? "text-destructive" : "text-success"}>{yoy < 0 ? "▼" : "▲"} {Math.abs(yoy)}% YoY</b></span>}>
        <ResponsiveContainer width="100%" height={180}><BarChart data={QUARTERS} margin={{ top: 16, left: -16, right: 4, bottom: 0 }}>{grad(`${id}q`)}
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 9 }} /><Tooltip formatter={(v: number) => `₹ ${fmt(v)} Cr`} /><Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="current" name="2026-27" fill={`url(#${id}q-0)`} radius={[3, 3, 0, 0]} maxBarSize={26}><LabelList dataKey="current" position="top" style={{ fontSize: 8, fill: "var(--primary)" }} /></Bar>
          <Bar dataKey="previous" name="2025-26" fill={`url(#${id}q-3)`} radius={[3, 3, 0, 0]} maxBarSize={26}><LabelList dataKey="previous" position="top" style={{ fontSize: 8, fill: "var(--muted-foreground)" }} /></Bar>
        </BarChart></ResponsiveContainer></Card>
    </div>

    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <Card title="Plant Analytics" sub={<span className="inline-flex items-center gap-1"><Factory className="size-3" />Top 10 · ₹ Cr</span>}>
        <Columns data={plants.map((p) => ({ name: p.code, value: p.value }))} height={150} /><CodeTable rows={plants} codeLabel="Plant Code" /></Card>
      <Card title="Profit Center Analytics" sub="Top 10 · ₹ Cr">
        <Columns data={PROFIT_CENTERS.map((p) => ({ name: p.code.slice(-5), value: p.value }))} height={150} /><CodeTable rows={PROFIT_CENTERS} codeLabel="Profit Center" /></Card>
    </div>
  </div>;
}
