import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CRORE, cashTrend, type CashTransaction } from "@/lib/cash-flow";
import { Switch } from "@/components/ui/switch";
const colors = ["var(--primary)", "var(--chart-2)", "var(--cash-orange)", "var(--cash-sage)", "var(--chart-4)", "var(--chart-5)"];
export function CashSpark({ rows, field = "net", positive = false }: { rows: CashTransaction[]; field?: "net" | "credit"; positive?: boolean }) {
  return <div className="cash-spark"><ResponsiveContainer width="100%" height="100%"><AreaChart data={cashTrend(rows, false)}><Area type="monotone" dataKey={field} stroke={positive ? "var(--success)" : "var(--primary)"} fill={positive ? "var(--success)" : "var(--primary)"} fillOpacity={0.12} strokeWidth={2} isAnimationActive={false} /></AreaChart></ResponsiveContainer></div>;
}
function TrendTrack({ data }: { data: ReturnType<typeof cashTrend> }) {
  return <ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }} barGap={3}>
    <CartesianGrid vertical={false} stroke="var(--chart-grid-line)" /><XAxis dataKey="name" tickLine={false} axisLine={{ stroke: "var(--border)" }} fontSize={10} />
    <YAxis tickLine={false} axisLine={false} width={43} fontSize={10} tickFormatter={value => Number(value).toFixed(0)} />
    <Tooltip formatter={value => [`₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Cr`]} />
    <Bar name="Credits" dataKey="credit" fill="var(--chart-2)" maxBarSize={14} isAnimationActive={false} /><Bar name="Debits" dataKey="debit" fill="var(--cash-orange)" maxBarSize={14} isAnimationActive={false} />
  </BarChart></ResponsiveContainer>;
}
export function CashTrendPanel({ rows, quarterly, onChange }: { rows: CashTransaction[]; quarterly: boolean; onChange: (value: boolean) => void }) {
  const data = cashTrend(rows, quarterly); const split = Math.ceil(data.length / 2);
  return <section className="cash-panel cash-trend"><div className="cash-panel-heading"><h2>Credit vs Debit Trend</h2><label className="flex items-center gap-1.5 text-[10px]">Monthly / Quarterly<Switch aria-label="Quarterly trend" checked={quarterly} onCheckedChange={onChange} className="h-4 w-7 [&>span]:size-3 [&>span]:data-[state=checked]:translate-x-3" /></label></div>
    <div className="cash-trend-tracks"><div className="cash-canvas"><TrendTrack data={data.slice(0, split)} /></div><div className="cash-canvas"><TrendTrack data={data.slice(split)} /></div></div>
    <div className="cash-legend"><span><i className="cash-dot-teal" />Credits</span><span><i className="cash-dot-orange" />Debits</span><span className="text-muted-foreground">Amount (₹ Cr)</span></div>
  </section>;
}
const top = (items: { name: string; value: number }[], limit: number) => {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const rest = sorted.slice(limit).reduce((sum, item) => sum + item.value, 0);
  return rest > 0 ? [...sorted.slice(0, limit), { name: "Others", value: rest }] : sorted;
};
const palette = (i: number) => colors[i % colors.length];
export function CashPlantPanel({ rows }: { rows: CashTransaction[] }) {
  const map = new Map<string, { name: string; Credits: number; Debits: number }>();
  rows.forEach(row => { const e = map.get(row.plant || "—") ?? { name: row.plant || "—", Credits: 0, Debits: 0 }; e.Credits += Math.abs(row.credit) / CRORE; e.Debits += Math.abs(row.debit) / CRORE; map.set(e.name, e); });
  const groups = [...map.values()].sort((a, b) => (b.Credits + b.Debits) - (a.Credits + a.Debits));
  return <section className="cash-panel"><div className="cash-panel-heading"><h2>Cash Flow by Plant & Profit Centre</h2></div><div className="cash-canvas cash-plant-scroll"><div className="cash-plant-inner" style={{ height: Math.max(180, groups.length * 26) }}><ResponsiveContainer width="100%" height="100%"><BarChart data={groups} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
    <CartesianGrid horizontal={false} stroke="var(--chart-grid-line)" /><XAxis type="number" fontSize={10} tickLine={false} tickFormatter={value => Number(value).toFixed(0)} /><YAxis type="category" dataKey="name" width={42} fontSize={10} tickLine={false} axisLine={false} interval={0} /><Tooltip formatter={(value, name) => [`₹${Number(value).toFixed(2)} Cr`, name]} />
    <Bar dataKey="Credits" fill="var(--cash-sage, #14b8a6)" maxBarSize={10} isAnimationActive={false} /><Bar dataKey="Debits" fill="var(--cash-orange, #f97316)" maxBarSize={10} isAnimationActive={false} />
  </BarChart></ResponsiveContainer></div></div><div className="cash-legend"><span><i className="cash-dot-teal" />Credits</span><span><i className="cash-dot-orange" />Debits</span></div><p className="cash-axis-note">Amount (₹ Cr)</p></section>;
}
export function CashNaturePanel({ rows }: { rows: CashTransaction[] }) {
  const sum = (key: "nature" | "pcGroup") => { const m = new Map<string, number>(); rows.forEach(r => m.set(r[key] || "—", (m.get(r[key] || "—") ?? 0) + (Math.abs(r.credit) + Math.abs(r.debit)) / CRORE)); return [...m].map(([name, value]) => ({ name, value })); };
  const data = top(sum("nature"), 5); const groups = top(sum("pcGroup"), 5);
  return <section className="cash-panel cash-nature-panel"><div className="cash-panel-heading"><h2>Cash Flow by Nature & PC Group</h2></div><div className="cash-nature-body"><div className="cash-nature-left"><div className="cash-donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="52%" outerRadius="82%" paddingAngle={1} stroke="none" labelLine={false} isAnimationActive={false}>{data.map((item, i) => <Cell key={item.name} fill={palette(i)} />)}</Pie><Tooltip formatter={(value, name) => [`₹${Number(value).toFixed(2)} Cr`, name]} /></PieChart></ResponsiveContainer></div><div className="cash-nature-legend">{data.map((item, i) => <div key={item.name} title={item.name}><i style={{ background: palette(i) }} /><span>{item.name}</span><b>₹{item.value.toFixed(2)} Cr</b></div>)}</div></div><div className="cash-group-legend"><strong>PC Group</strong>{groups.map((group, i) => <div key={group.name} title={group.name}><i style={{ background: palette(i) }} /><span>{group.name}<small>₹{group.value.toFixed(2)} Cr</small></span></div>)}</div></div></section>;
}
