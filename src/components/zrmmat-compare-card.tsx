import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, ChevronsUpDown, Download, Eye } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bar, CartesianGrid, Cell, ComposedChart, LabelList, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { getMasterRows, mastersQuery } from "@/lib/sap-master";
import { datedFileName } from "@/lib/format";
import { radiantBar, radiantColor } from "@/lib/radiant";
import type { PurchaseRow } from "@/lib/purchase-register-data";
import { matchRows, monthSeries, normMat, summarize, zrmmatMaterials } from "@/lib/purchase-zrmmat-compare";

const n2 = (v: number) => v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cr = (inr: number) => n2(inr / 1e7);
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const ml = (k: string) => `${MON[Number(k.slice(5, 7)) - 1]}-${k.slice(2, 4)}`;
const sign = (v: number | null) => (v == null ? "–" : `${v > 0 ? "+" : ""}${n2(v)}`);
const tone = (v: number | null) => (v == null || v === 0 ? "" : v > 0 ? "text-destructive" : "text-emerald-600");
const ALL = "__all__";

const zrmmatRowsQuery = {
  queryKey: ["sap-master-rows", "zrmmat-all"] as const,
  queryFn: async () => {
    const ms = await mastersQuery("zrmmat").queryFn();
    const all = await Promise.all(ms.map((m) => getMasterRows(m.id)));
    return all.flat();
  },
  staleTime: Infinity,
};

export function ZrmmatCompareCard({ rows }: { rows: PurchaseRow[] }) {
  const q = useQuery({ ...zrmmatRowsQuery, refetchOnWindowFocus: false });
  const mats = useMemo(() => zrmmatMaterials(q.data ?? []), [q.data]);
  const names = useMemo(() => { const m = new Map<string, string>(); for (const r of rows) m.set(normMat(r.material), r.materialName); return m; }, [rows]);
  const [sel, setSel] = useState(ALL);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [detailMonth, setDetailMonth] = useState<string | null>(null);

  const perMat = useMemo(() => mats.map((m) => { const rs = matchRows(rows, m); return { m, rs, s: summarize(rs) }; }), [mats, rows]);
  const current = sel === ALL ? null : perMat.find((p) => p.m.material === sel) ?? null;
  const matched = current ? current.rs : perMat.flatMap((p) => p.rs);
  const sum = useMemo(() => summarize(matched), [matched]);
  const series = useMemo(() => (current ? monthSeries(current.rs) : []), [current]);
  const detailRows = useMemo(() => (current && detailMonth ? current.rs.filter((r) => r.date.startsWith(detailMonth)).sort((a, b) => a.date.localeCompare(b.date)) : []), [current, detailMonth]);
  const opts = perMat.filter((p) => { const s = search.toLowerCase(); return !s || p.m.material.toLowerCase().includes(s) || (names.get(p.m.material) ?? "").toLowerCase().includes(s); });

  const tiles = [
    { label: "Total Procurement Value (₹ Cr)", value: cr(sum.valueInr) },
    { label: "Total Quantity", value: `${n2(sum.qty)} ${current ? sum.unit : ""}` },
    { label: "PO / Documents", value: sum.docs.toLocaleString("en-IN") },
    { label: "Unit Price (₹)", value: current ? n2(sum.price) : "–", hint: "Total value ÷ total quantity" },
    { label: "Unit Price Variance (MoM)", value: current ? `${sign(sum.latestMom)}${sum.latestMomPct != null ? ` (${sign(sum.latestMomPct)}%)` : ""}` : "–", hint: "Latest month vs previous month" },
  ];

  const exportXlsx = async () => {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet("ZRMMAT Compare");
    if (current) {
      ws.addRow(["Month", "Quantity", "PO Value (₹ Cr)", "Unit Price (₹)", "vs prev (₹)", "vs prev (%)", "Diff from first (₹)"]);
      series.forEach((p) => ws.addRow([ml(p.month), p.qty, p.valueInr / 1e7, p.price, p.mom, p.momPct, p.fromFirst]));
    } else {
      ws.addRow(["Material", "Description", "Quantity", "Value (₹ Cr)", "Unit Price (₹)", "Latest MoM (₹)", "Latest MoM (%)"]);
      perMat.forEach((p) => ws.addRow([p.m.material, names.get(p.m.material) ?? "", p.s.qty, p.s.valueInr / 1e7, p.s.price, p.s.latestMom, p.s.latestMomPct]));
    }
    const buf = await wb.xlsx.writeBuffer();
    const url = URL.createObjectURL(new Blob([buf])); const a = document.createElement("a");
    a.href = url; a.download = datedFileName("Purchase Register", "xlsx"); a.click(); URL.revokeObjectURL(url);
  };

  return <section className="rounded-xl border border-border bg-card p-2 shadow-sm">
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <h2 className="mr-auto text-xs font-semibold text-card-foreground">ZRMMAT Material Comparison</h2>
      {sel !== ALL && <Button size="sm" variant="outline" className="h-8" onClick={() => { setSel(ALL); setSearch(""); setDetailMonth(null); }}><ArrowLeft className="size-3.5" />Back</Button>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button size="sm" variant="outline" className="h-8 w-[280px] justify-between text-xs font-normal">
            <span className="truncate">{sel === ALL ? `All ZRMMAT materials (${mats.length})` : `${sel}${names.get(sel) ? ` - ${names.get(sel)}` : ""}`}</span>
            <ChevronsUpDown className="size-3.5 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[340px] p-0" align="end">
          <Command shouldFilter={false}>
            <CommandInput value={search} onValueChange={setSearch} placeholder="Search material code or name" className="text-xs" />
            <CommandList>
              <CommandEmpty>No material found.</CommandEmpty>
              <CommandItem value={ALL} onSelect={() => { setSel(ALL); setDetailMonth(null); setOpen(false); }} className="text-xs">
                <Check className={`size-3.5 ${sel === ALL ? "opacity-100" : "opacity-0"}`} />All ZRMMAT materials ({mats.length})
              </CommandItem>
              {opts.map((p) => <CommandItem key={p.m.material} value={p.m.material} onSelect={() => { setSel(p.m.material); setDetailMonth(null); setOpen(false); }} className="text-xs">
                <Check className={`size-3.5 ${sel === p.m.material ? "opacity-100" : "opacity-0"}`} />
                <span className="truncate">{p.m.material}{names.get(p.m.material) ? ` - ${names.get(p.m.material)}` : ""}{p.rs.length ? "" : " (no purchase)"}</span>
              </CommandItem>)}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Button size="sm" variant="outline" className="h-8" onClick={exportXlsx}><Download className="size-3.5" />Excel</Button>
    </div>
    {q.isLoading ? <p className="p-4 text-xs text-muted-foreground">Loading ZRMMAT materials…</p> : !mats.length ? <p className="p-4 text-xs text-muted-foreground">No ZRMMAT materials uploaded yet.</p> : <>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {tiles.map((t, i) => <div key={t.label} title={t.hint} className="text-on-radiant rounded-lg p-2 shadow-sm" style={{ background: radiantBar(i) }}>
          <div className="text-[10px] opacity-90">{t.label}</div><div className="text-sm font-bold tabular-nums">{t.value}</div>
        </div>)}
      </div>
      {current ? <div className="mt-2 grid grid-cols-1 gap-2 lg:grid-cols-2">
        <div className="h-60"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={series.map((p) => ({ m: ml(p.month), price: +p.price.toFixed(2) }))} margin={{ top: 30 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="m" fontSize={10} /><YAxis fontSize={10} tickFormatter={(v: number) => n2(v)} domain={[(min: number) => { const max = Math.max(...series.map((p) => p.price)); const pad = Math.max((max - min) * 0.5, min * 0.01); return Math.max(0, +(min - pad).toFixed(2)); }, (max: number) => { const min = Math.min(...series.map((p) => p.price)); const pad = Math.max((max - min) * 0.1, max * 0.005); return +(max + pad).toFixed(2); }]} />
          <Tooltip formatter={(v: number) => [`₹ ${n2(v)}`, "Month avg price"]} />
          <defs>
            {series.map((p, i) => <linearGradient key={p.month} id={`zr-g-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={radiantColor(i)} stopOpacity={0.95} />
              <stop offset="100%" stopColor={radiantColor(i)} stopOpacity={0.35} />
            </linearGradient>)}
          </defs>
          <Bar dataKey="price" name="Month avg price (₹)" radius={[8, 8, 0, 0]} maxBarSize={70}>
            {series.map((p, i) => <Cell key={p.month} fill={`url(#zr-g-${i})`} stroke={radiantColor(i)} strokeWidth={1} />)}
          </Bar>
          <Line type="monotone" dataKey="price" name="Trend" stroke="#d64550" strokeWidth={2} dot={{ r: 3, strokeWidth: 1.5, fill: "white" }} activeDot={{ r: 5 }} legendType="none" tooltipType="none">
            <LabelList dataKey="price" content={(props: { x?: number | string; y?: number | string; value?: number | string }) => {
              const x = Number(props.x), y = Number(props.y), t = n2(Number(props.value)); const w = t.length * 6 + 10;
              return <g><rect x={x - w / 2} y={y - 26} width={w} height={16} rx={4} fill="white" stroke="#cbd5e1" strokeWidth={0.75} /><text x={x} y={y - 15} textAnchor="middle" fontSize={10} fontWeight={700} fill="#1e293b" stroke="none">{t}</text></g>;
            }} />
          </Line>
        </ComposedChart></ResponsiveContainer></div>
        <div className="max-h-60 overflow-auto"><table className="w-full text-[11px]">
          <thead className="text-on-radiant sticky top-0" style={{ background: "linear-gradient(90deg,#1f6fd1,#0f9d8a,#8e44ad)" }}><tr>{["Month", "Qty", "PO Value (₹ Cr)", "Month avg price (₹)", "vs prev month", "Diff from first (₹)", "Item Details"].map((h) => <th key={h} className="px-1.5 py-1 text-left">{h}</th>)}</tr></thead>
          <tbody>{series.map((p) => <tr key={p.month} className="border-t border-border/60">
            <td className="px-1.5 py-0.5">{ml(p.month)}</td><td className="px-1.5 tabular-nums">{n2(p.qty)}</td><td className="px-1.5 tabular-nums">{cr(p.valueInr)}</td><td className="px-1.5 tabular-nums">{n2(p.price)}</td>
            <td className={`px-1.5 tabular-nums ${tone(p.mom)}`}>{sign(p.mom)}{p.momPct != null ? ` (${sign(p.momPct)}%)` : ""}</td><td className={`px-1.5 tabular-nums ${tone(p.fromFirst)}`}>{sign(p.fromFirst)}</td>
            <td className="px-1.5"><Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => setDetailMonth(p.month)}><Eye className="size-3" />View</Button></td>
          </tr>)}</tbody>
        </table>{!series.length ? <p className="p-3 text-xs text-muted-foreground">No purchases of this material in the selected period.</p> : null}</div>
      </div> : <div className="mt-2 max-h-72 overflow-auto"><table className="w-full text-[11px]">
        <thead className="text-on-radiant sticky top-0" style={{ background: "linear-gradient(90deg,#1f6fd1,#0f9d8a,#8e44ad)" }}><tr>{["Material", "Description", "Qty", "Value (₹ Cr)", "Unit Price (₹)", "Latest MoM"].map((h) => <th key={h} className="px-1.5 py-1 text-left">{h}</th>)}</tr></thead>
        <tbody>{[...perMat].filter((p) => p.rs.length).sort((a, b) => b.s.valueInr - a.s.valueInr).map((p) => <tr key={p.m.material} onClick={() => setSel(p.m.material)} className="cursor-pointer border-t border-border/60 hover:bg-muted">
          <td className="px-1.5 py-0.5 font-medium text-primary">{p.m.material}</td><td className="truncate px-1.5">{names.get(p.m.material)}</td><td className="px-1.5 tabular-nums">{n2(p.s.qty)} {p.s.unit}</td><td className="px-1.5 tabular-nums">{cr(p.s.valueInr)}</td><td className="px-1.5 tabular-nums">{n2(p.s.price)}</td>
          <td className={`px-1.5 tabular-nums ${tone(p.s.latestMom)}`}>{sign(p.s.latestMom)}{p.s.latestMomPct != null ? ` (${sign(p.s.latestMomPct)}%)` : ""}</td>
        </tr>)}</tbody>
      </table></div>}
    </>}
    <Dialog open={!!detailMonth} onOpenChange={(o) => !o && setDetailMonth(null)}>
      <DialogContent className="max-w-5xl">
        <DialogHeader><DialogTitle className="text-sm">{current?.m.material} {names.get(current?.m.material ?? "") ?? ""} — {detailMonth ? ml(detailMonth) : ""} ({detailRows.length} items)</DialogTitle></DialogHeader>
        <div className="max-h-[60vh] overflow-auto"><table className="w-full text-[11px]">
          <thead className="text-on-radiant sticky top-0" style={{ background: "linear-gradient(90deg,#1f6fd1,#0f9d8a,#8e44ad)" }}><tr>{["#", "Posting Date", "Invoice Doc", "GR Doc", "Plant", "Vendor", "Invoice Qty", "Net Amount (₹)", "Unit Price (₹)"].map((h) => <th key={h} className="px-1.5 py-1 text-left">{h}</th>)}</tr></thead>
          <tbody>{detailRows.map((r, i) => <tr key={`${r.docNo}-${i}`} className="border-t border-border/60 odd:bg-muted/40">
            <td className="px-1.5 py-0.5">{i + 1}</td><td className="px-1.5">{r.date.split("-").reverse().join("-")}</td><td className="px-1.5">{r.docNo}</td><td className="px-1.5">{r.grNo}</td>
            <td className="px-1.5">{r.plant}{r.plantSh ? ` - ${r.plantSh}` : ""}</td><td className="truncate px-1.5">{r.vendorName}</td>
            <td className="px-1.5 tabular-nums">{n2(r.qty ?? 0)} {r.unit}</td><td className="px-1.5 tabular-nums">{n2(r.value * 1e7)}</td><td className="px-1.5 tabular-nums">{n2(r.qty ? (r.value * 1e7) / r.qty : r.rate ?? 0)}</td>
          </tr>)}</tbody>
          <tfoot><tr className="border-t-2 border-border font-bold"><td className="px-1.5 py-1" colSpan={6}>Grand Total</td>
            <td className="px-1.5 tabular-nums">{n2(detailRows.reduce((s, r) => s + (r.qty ?? 0), 0))}</td>
            <td className="px-1.5 tabular-nums">{n2(detailRows.reduce((s, r) => s + r.value * 1e7, 0))}</td>
            <td className="px-1.5 tabular-nums">{(() => { const q = detailRows.reduce((s, r) => s + (r.qty ?? 0), 0); return q ? n2(detailRows.reduce((s, r) => s + r.value * 1e7, 0) / q) : "–"; })()}</td></tr></tfoot>
        </table></div>
      </DialogContent>
    </Dialog>
  </section>;
}
