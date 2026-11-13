import { useMemo, useRef, useState } from "react";
import { UploadExcelButton } from "@/components/upload-excel-button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { AccessDenied, ReportShell } from "@/components/report-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";
import { addMasterRow, deleteMaster, deleteMasterRows, downloadMasterExcel, getMasterRowsWithId, mastersQuery, parseWorkbook, ROW_KEY, countUniqueKeys, keyLabel, updateMasterRow, uploadSheet, type ParsedSheet, type MasterCategory } from "@/lib/sap-master";

const PAGE = 50;
const fmtIst = (s?: string | null) => s ? new Date(s).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "—";

export function MasterTableScreen({ cat, title, screenKey, singleSheet }: { cat: MasterCategory; title: string; screenKey: string; singleSheet?: boolean }) {
  const { data, isLoading } = useLaunchpad();
  const isAdmin = !!data?.isSuperAdmin || (data?.roles ?? []).some((r) => r === "admin" || r === "super_admin");
  const allowed = isAdmin || hasScreen(data?.screens, screenKey);
  return <ReportShell title={title} description="Tables Master">
    {!isLoading && !allowed ? <AccessDenied area={title} /> : <View isAdmin={isAdmin} cat={cat} title={title} single={!!singleSheet} />}
  </ReportShell>;
}

function View({ isAdmin, cat: CAT, title, single }: { isAdmin: boolean; cat: MasterCategory; title: string; single: boolean }) {
  const masters = mastersQuery(CAT);
  const qc = useQueryClient();
  const list = useQuery({ ...masters, refetchOnWindowFocus: false });
  const [selId, setSelId] = useState("");
  const latest = useMemo(() => [...(list.data ?? [])].sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""))[0], [list.data]);
  const current = single ? latest : list.data?.find((m) => m.id === selId) ?? list.data?.[0];
  const rows = useQuery({ queryKey: ["master-rows", CAT, current?.id, current?.last_uploaded_at], queryFn: () => getMasterRowsWithId(current!.id), enabled: !!current, refetchOnWindowFocus: false });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [edit, setEdit] = useState<{ id: string | null; data: Record<string, string> } | null>(null);
  const cols = current?.columns ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const all = rows.data ?? [];
    return q ? all.filter((r) => cols.some((c) => (r.data[c] ?? "").toLowerCase().includes(q))) : all;
  }, [rows.data, search, cols]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const view = filtered.slice(page * PAGE, page * PAGE + PAGE);

  const fileRef = useRef<HTMLInputElement>(null);
  const [sheets, setSheets] = useState<ParsedSheet[] | null>(null);
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const reload = async () => { void qc.invalidateQueries({ queryKey: ["tables-master-status"] }); await qc.invalidateQueries({ queryKey: ["sap-masters", CAT] }); await qc.invalidateQueries({ queryKey: ["master-rows", CAT] }); await qc.invalidateQueries({ queryKey: ["sap-master-rows", `${CAT}-all`] }); }; 

  const onFile = async (f: File) => {
    try {
      const s = await parseWorkbook(f);
      if (!s.length) { toast.error("No sheets with a header row found"); return; }
      if (single) {
        const sheet = { ...s[0]!, name: current?.name ?? s[0]!.name };
        if (current && !confirm(`This will replace the current ${title} data (${current.row_count} rows) with ${sheet.rows.length} rows from the file. Continue?`)) return;
        try {
          setBusy("Starting…");
          const n = await uploadSheet(sheet, ROW_KEY, (d, t) => setBusy(`${d} / ${t} rows`), CAT);
          for (const m of list.data ?? []) if (m.name !== sheet.name) await deleteMaster(m.id);
          toast.success(`${n} rows saved`); await reload();
        } catch (e) { toast.error(`Upload failed: ${(e as Error).message}`); } finally { setBusy(null); }
        return;
      }
      const known = new Map((list.data ?? []).map((m) => [m.name, m.key_column]));
      setKeys(Object.fromEntries(s.map((x) => { const k = known.get(x.name); return [x.name, k && k !== ROW_KEY && k.split("+").every((c) => x.columns.includes(c)) ? k : ROW_KEY]; })));
      setSheets(s);
    } catch { toast.error("Could not read this Excel file"); }
  };
  const save = async () => {
    if (!sheets) return;
    const lost = sheets.filter((s) => countUniqueKeys(s.rows, keys[s.name]!) < s.rows.length);
    if (lost.length && !confirm(lost.map((s) => `${s.name}: ${s.rows.length} rows in file → only ${countUniqueKeys(s.rows, keys[s.name]!)} unique keys`).join("\n") + "\n\nRows with the same key will be merged. Continue?")) return;
    try {
      for (const s of sheets) {
        setBusy(`${s.name}: starting…`);
        const n = await uploadSheet(s, keys[s.name]!, (d, t) => setBusy(`${s.name}: ${d} / ${t} rows`), CAT);
        toast.success(`${s.name}: ${n} rows saved`);
      }
      setSheets(null); await reload();
    } catch (e) { toast.error(`Upload failed: ${(e as Error).message}`); } finally { setBusy(null); }
  };
  const run = async (fn: () => Promise<void>, ok: string) => {
    try { await fn(); toast.success(ok); await reload(); } catch (e) { toast.error((e as Error).message); }
  };
  const saveEdit = async () => {
    if (!edit || !current) return;
    await run(async () => {
      if (edit.id) await updateMasterRow(current.id, current.key_column, edit.id, edit.data);
      else await addMasterRow(current.id, current.key_column, edit.data);
      setEdit(null);
    }, edit.id ? "Row updated" : "Row added");
  };
  const delRows = (ids: string[]) => { if (current && ids.length && confirm(`Delete ${ids.length} row(s)?`)) void run(() => deleteMasterRows(current.id, ids), `${ids.length} row(s) deleted`); };

  return <div className="space-y-4">
    <div className="flex flex-wrap items-end gap-3 rounded-lg border tm-panel p-4 md:flex-nowrap">
      {!single && <div className="w-full sm:w-auto sm:min-w-56 md:min-w-40 md:shrink-0">
        <div className="mb-1 text-xs text-muted-foreground">Select Sheet</div>
        <Select value={current?.id ?? ""} onValueChange={(v) => { setSelId(v); setPage(0); setSearch(""); }}>
          <SelectTrigger><SelectValue placeholder={list.isLoading ? "Loading…" : "Upload Excel to see sheets"} /></SelectTrigger>
          <SelectContent>{(list.data ?? []).map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>}
      <Input className="w-full sm:w-auto sm:min-w-48 sm:flex-1 md:w-32 md:min-w-0 xl:max-w-80" placeholder="Search…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
      {current && <div className="min-w-0 text-xs text-muted-foreground md:max-w-40 md:truncate">{current.row_count} rows · {cols.length} columns · Key: {keyLabel(current.key_column)}</div>}
      <div className="flex w-full flex-wrap justify-end gap-2 md:ml-auto md:w-auto md:shrink-0 md:flex-nowrap">
        {current && <Button className="btn-success md:px-3" onClick={() => downloadMasterExcel(current.name, cols, filtered.map((r) => r.data), title)}><Download className="mr-1 h-4 w-4" />Excel</Button>}
        {isAdmin && <>
          {current && <Button variant="outline" onClick={() => setEdit({ id: null, data: Object.fromEntries(cols.map((c) => [c, ""])) })}><Plus className="mr-1 h-4 w-4" />Add row</Button>}
          {current && <Button className="btn-danger md:px-3" onClick={() => { if (confirm(single ? `Delete all ${title} data?` : `Delete sheet "${current.name}" and all its rows?`)) void run(() => deleteMaster(current.id), "Sheet deleted").then(() => setSelId("")); }}><Trash2 className="mr-1 h-4 w-4" />{single ? "Delete" : "Delete sheet"}</Button>}
          <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = ""; }} />
          <UploadExcelButton busy={single ? busy : null} onClick={() => fileRef.current?.click()} />
        </>}
      </div>
    </div>

    <div className="tm-card">
    <div className="tm-card-head">
      <div className="text-sm font-semibold">{single ? title : current?.name ?? title} <span className="text-xs font-normal text-muted-foreground">· {filtered.length} rows</span></div>
    {current && <div className="text-xs text-muted-foreground">Created on <span className="font-medium text-foreground">{fmtIst(current.created_at)}</span> · Last updated on <span className="font-medium text-foreground">{fmtIst(current.updated_at)}</span> IST</div>}
    </div>
    <div className="tm-card-body"><div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 z-10 tm-thead"><tr>
          {cols.map((c) => <th key={c} className="whitespace-nowrap px-2.5 py-2 text-left text-[11px] font-semibold uppercase tracking-wide">{c}</th>)}
          {isAdmin && cols.length > 0 && <th className="px-2.5 py-2 text-right text-[11px] font-semibold uppercase">Actions</th>}
        </tr></thead>
        <tbody>
          {view.map((r) => <tr key={r.id} className="border-t odd:bg-muted/40 hover:bg-accent/50">
            {cols.map((c) => <td key={c} className="whitespace-nowrap px-2.5 py-1">{r.data[c] ?? ""}</td>)}
            {isAdmin && <td className="whitespace-nowrap px-2.5 py-1 text-right">
              <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Edit row" onClick={() => setEdit({ id: r.id, data: { ...Object.fromEntries(cols.map((c) => [c, ""])), ...r.data } })}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/15" aria-label="Delete row" onClick={() => delRows([r.id])}><Trash2 className="h-3.5 w-3.5" /></Button>
            </td>}
          </tr>)}
          {!view.length && <tr><td className="px-3 py-6 text-center text-muted-foreground" colSpan={Math.max(1, cols.length + 1)}>{rows.isLoading ? "Loading…" : current ? "No rows" : isAdmin ? `Upload an Excel file to create ${title}.` : `No ${title} data uploaded yet.`}</td></tr>}
        </tbody>
      </table>
    </div></div>
    <div className="flex items-center gap-2 border-t px-3 py-2 text-sm">
      <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</Button>
      <span>Page {page + 1} of {pages} · {filtered.length} rows</span>
      <Button size="sm" variant="outline" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next</Button>
    </div>
    </div>

    <Dialog open={!!edit} onOpenChange={(o) => { if (!o) setEdit(null); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{edit?.id ? "Edit row" : "Add row"}</DialogTitle></DialogHeader>
        <div className="grid max-h-[60vh] grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2">
          {cols.map((c) => <label key={c} className="text-xs">
            <span className="mb-1 block text-muted-foreground">{c}{current?.key_column.split("+").includes(c) ? " (key) *" : ""}</span>
            <Input value={edit?.data[c] ?? ""} onChange={(e) => setEdit((x) => x && { ...x, data: { ...x.data, [c]: e.target.value } })} />
          </label>)}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={saveEdit}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={!!sheets} onOpenChange={(o) => { if (!o && !busy) setSheets(null); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Upload {title}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Each sheet is stored separately. With no key, every Excel row is kept and the sheet is fully replaced. With key columns, rows with a matching key are updated.</p>
        <div className="max-h-80 space-y-3 overflow-y-auto">
          {sheets?.map((s) => <div key={s.name} className="rounded border p-3">
            <div className="font-medium">{s.name} <span className="text-xs text-muted-foreground">· {s.rows.length} rows · {s.columns.length} columns</span></div>
            <div className="mt-2 text-sm">
              {(() => { const k = keys[s.name] ?? ROW_KEY; const sel = k === ROW_KEY ? [] : k.split("+");
                const toggle = (c: string) => { const n = sel.includes(c) ? sel.filter((x) => x !== c) : [...sel, c]; setKeys({ ...keys, [s.name]: n.length ? n.join("+") : ROW_KEY }); };
                const u = countUniqueKeys(s.rows, k);
                return <>
                  <label className="flex items-center gap-2 font-medium"><input type="checkbox" checked={k === ROW_KEY} onChange={() => setKeys({ ...keys, [s.name]: ROW_KEY })} /> No key – keep every row</label>
                  <div className="mt-1 text-xs text-muted-foreground">Or pick key column(s):</div>
                  <div className="mt-1 flex max-h-28 flex-wrap gap-x-3 gap-y-1 overflow-y-auto">{s.columns.map((c) => <label key={c} className="flex items-center gap-1 text-xs"><input type="checkbox" checked={sel.includes(c)} onChange={() => toggle(c)} />{c}</label>)}</div>
                  <div className={`mt-2 text-xs ${u < s.rows.length ? "text-destructive font-medium" : "text-muted-foreground"}`}>{s.rows.length} rows in file → {u} will be stored (key: {keyLabel(k)})</div>
                </>; })()}
            </div>
          </div>)}
        </div>
        {busy && <div className="text-sm">{busy}</div>}
        <DialogFooter><Button disabled={!!busy} onClick={save}>{busy ? "Saving…" : "Save"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
