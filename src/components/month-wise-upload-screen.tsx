import { useMemo, useRef, useState } from "react";
import { UploadExcelButton } from "@/components/upload-excel-button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Pencil, Trash2 } from "lucide-react";
import { AccessDenied, ReportShell } from "@/components/report-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";
import { downloadMasterExcel, parseWorkbook } from "@/lib/sap-master";
import { deleteRows, EXTRA_COLUMNS, fetchMonthRows, FY_MONTH_ORDER, MONTHS, nonEmptyRows, orderColumns, replaceMonth, updateRow } from "@/lib/month-wise-upload";

const PAGE = 50;
const TITLE = "Month Wise Upload";
const fmtIst = (s?: string | null) => s ? new Date(s).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "—";

export function MonthWiseUploadScreen() {
  const { data, isLoading } = useLaunchpad();
  const isAdmin = !!data?.isSuperAdmin || (data?.roles ?? []).some((r) => r === "admin" || r === "super_admin");
  const allowed = isAdmin || hasScreen(data?.screens, "tables.month-wise-upload");
  return <ReportShell title={TITLE} description="Tables Master">
    {!isLoading && !allowed ? <AccessDenied area={TITLE} /> : <View canEdit={allowed} />}
  </ReportShell>;
}

function View({ canEdit }: { canEdit: boolean }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const years = Array.from({ length: 8 }, (_, i) => now.getFullYear() + 1 - i);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["month-wise-upload", year, month], queryFn: () => fetchMonthRows(month, year), refetchOnWindowFocus: false });
  const rows = q.data ?? [];
  const cols = useMemo(() => orderColumns(rows), [rows]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [edit, setEdit] = useState<{ id: string; data: Record<string, string> } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const created = rows.reduce<string | null>((m, r) => !m || r.created_at < m ? r.created_at : m, null);
  const updated = rows.reduce<string | null>((m, r) => !m || r.updated_at > m ? r.updated_at : m, null);
  const label = `${MONTHS[month - 1]} ${year}`;
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return s ? rows.filter((r) => cols.some((c) => (r.data[c] ?? "").toLowerCase().includes(s))) : rows;
  }, [rows, cols, search]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const view = filtered.slice(page * PAGE, page * PAGE + PAGE);
  const reload = async () => { void qc.invalidateQueries({ queryKey: ["tables-master-status"] }); await qc.invalidateQueries({ queryKey: ["month-wise-upload", year, month] }); };

  const onFile = async (f: File) => {
    try {
      const sheets = await parseWorkbook(f);
      const data = nonEmptyRows(sheets[0]?.rows ?? []);
      if (!data.length) { toast.error("No rows found in this Excel file"); return; }
      if (rows.length && !confirm(`${label} already has ${rows.length} rows. Replace them with ${data.length} rows from this file?`)) return;
      setBusy("Uploading…");
      await replaceMonth(month, year, data, created, (d, t) => setBusy(`Uploading ${d} / ${t}`));
      toast.success(`${data.length} rows saved for ${label}`);
      await reload();
    } catch (e) { toast.error(`Upload failed: ${(e as Error).message}`); } finally { setBusy(null); }
  };
  const run = async (fn: () => Promise<void>, ok: string) => { try { await fn(); toast.success(ok); await reload(); } catch (e) { toast.error((e as Error).message); } };
  const allCols = [...cols, ...EXTRA_COLUMNS];
  const exportRows = filtered.map((r) => ({ ...r.data, Month: MONTHS[r.month - 1]!, Year: String(r.year), "Created Date": fmtIst(r.created_at), "Updated Date": fmtIst(r.updated_at) }));

  return <div className="space-y-4">
    <div className="flex flex-wrap items-end gap-3 rounded-lg border tm-panel p-4">
      <div className="w-40"><div className="mb-1 text-xs text-muted-foreground">Month</div>
        <Select value={String(month)} onValueChange={(v) => { setMonth(Number(v)); setPage(0); }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{FY_MONTH_ORDER.map((m) => <SelectItem key={m} value={String(m)}>{MONTHS[m - 1]}</SelectItem>)}</SelectContent>
        </Select></div>
      <div className="w-28"><div className="mb-1 text-xs text-muted-foreground">Year</div>
        <Select value={String(year)} onValueChange={(v) => { setYear(Number(v)); setPage(0); }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select></div>
      <Input className="max-w-xs" placeholder="Search…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
      <div className="text-xs text-muted-foreground">{rows.length} rows</div>
      <div className="ml-auto flex flex-wrap gap-2">
        {rows.length > 0 && <Button variant="outline" onClick={() => void downloadMasterExcel(label, allCols, exportRows, TITLE)}><Download className="mr-1 h-4 w-4" />Excel</Button>}
        {canEdit && <>
          {rows.length > 0 && <Button variant="outline" onClick={() => { if (confirm(`Delete all ${rows.length} rows for ${label}?`)) void run(() => deleteRows(rows.map((r) => r.id), month, year), "Month deleted"); }}><Trash2 className="mr-1 h-4 w-4" />Delete month</Button>}
          <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = ""; }} />
          <UploadExcelButton busy={busy} onClick={() => fileRef.current?.click()} />
        </>}
      </div>
    </div>
    {rows.length > 0 && <div className="text-xs text-muted-foreground">{label} · Created on <span className="font-medium text-foreground">{fmtIst(created)}</span> · Last updated on <span className="font-medium text-foreground">{fmtIst(updated)}</span> IST</div>}
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-xs">
        <thead className="sticky top-0 z-10 tm-thead"><tr>
          {allCols.map((c) => <th key={c} className="whitespace-nowrap px-2.5 py-2 text-left text-[11px] font-semibold uppercase tracking-wide">{c}</th>)}
          {canEdit && rows.length > 0 && <th className="px-2.5 py-2 text-right text-[11px] font-semibold uppercase">Actions</th>}
        </tr></thead>
        <tbody>
          {view.map((r) => <tr key={r.id} className="border-t odd:bg-muted/40 hover:bg-accent/50">
            {cols.map((c) => <td key={c} className="whitespace-nowrap px-2.5 py-1">{r.data[c] ?? ""}</td>)}
            <td className="whitespace-nowrap px-2.5 py-1">{MONTHS[r.month - 1]}</td>
            <td className="px-2.5 py-1">{r.year}</td>
            <td className="whitespace-nowrap px-2.5 py-1">{fmtIst(r.created_at)}</td>
            <td className="whitespace-nowrap px-2.5 py-1">{fmtIst(r.updated_at)}</td>
            {canEdit && <td className="whitespace-nowrap px-2.5 py-1 text-right">
              <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Edit row" onClick={() => setEdit({ id: r.id, data: { ...Object.fromEntries(cols.map((c) => [c, ""])), ...r.data } })}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" aria-label="Delete row" onClick={() => { if (confirm("Delete this row?")) void run(() => deleteRows([r.id], month, year), "Row deleted"); }}><Trash2 className="h-3.5 w-3.5" /></Button>
            </td>}
          </tr>)}
          {!view.length && <tr><td className="px-3 py-6 text-center text-muted-foreground" colSpan={allCols.length + 1}>{q.isLoading ? "Loading…" : `No data for ${label}. Upload an Excel file.`}</td></tr>}
        </tbody>
      </table>
    </div>
    {pages > 1 && <div className="flex items-center gap-2 text-xs">
      <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</Button>
      <span>Page {page + 1} / {pages}</span>
      <Button size="sm" variant="outline" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</Button>
    </div>}
    <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit row</DialogTitle></DialogHeader>
        {edit && <div className="grid gap-2">{cols.map((c) => <label key={c} className="grid gap-1 text-xs">{c}
          <Input value={edit.data[c] ?? ""} onChange={(e) => setEdit({ ...edit, data: { ...edit.data, [c]: e.target.value } })} /></label>)}</div>}
        <DialogFooter><Button onClick={() => edit && void run(async () => { await updateRow(edit.id, edit.data); setEdit(null); }, "Row updated")}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
