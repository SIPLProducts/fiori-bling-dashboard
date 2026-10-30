import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import { AccessDenied, ReportShell } from "@/components/report-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";
import { downloadMasterExcel, getMasterRows, parseWorkbook, sapMastersQuery, uploadSheet, type ParsedSheet } from "@/lib/sap-master";

export const Route = createFileRoute("/_authenticated/reports/tables/sap-master")({
  head: () => ({ meta: [
    { title: "SAP MASTER — HBL MIS Portal" },
    { name: "description", content: "Upload and view SAP master lists from Excel." },
    { property: "og:title", content: "SAP MASTER — HBL MIS Portal" },
    { property: "og:description", content: "Upload and view SAP master lists from Excel." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});

const PAGE = 50;

function Page() {
  const { data, isLoading } = useLaunchpad();
  const isAdmin = !!data?.isSuperAdmin || (data?.roles ?? []).some((r) => r === "admin" || r === "super_admin");
  const allowed = isAdmin || hasScreen(data?.screens, "tables.sap-master");
  return <ReportShell title="SAP MASTER" description="Tables Master">
    {!isLoading && !allowed ? <AccessDenied area="SAP MASTER" /> : <MasterView isAdmin={isAdmin} />}
  </ReportShell>;
}

function MasterView({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const masters = useQuery({ ...sapMastersQuery, refetchOnWindowFocus: false });
  const [selId, setSelId] = useState<string>("");
  const current = masters.data?.find((m) => m.id === selId) ?? masters.data?.[0];
  const rows = useQuery({ queryKey: ["sap-master-rows", current?.id, current?.last_uploaded_at], queryFn: () => getMasterRows(current!.id), enabled: !!current, refetchOnWindowFocus: false });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const cols = current?.columns ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const all = rows.data ?? [];
    return q ? all.filter((r) => cols.some((c) => (r[c] ?? "").toLowerCase().includes(q))) : all;
  }, [rows.data, search, cols]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const view = filtered.slice(page * PAGE, page * PAGE + PAGE);

  const fileRef = useRef<HTMLInputElement>(null);
  const [sheets, setSheets] = useState<ParsedSheet[] | null>(null);
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const onFile = async (f: File) => {
    try {
      const s = await parseWorkbook(f);
      if (!s.length) { toast.error("No sheets with a header row found"); return; }
      const known = new Map((masters.data ?? []).map((m) => [m.name, m.key_column]));
      setKeys(Object.fromEntries(s.map((x) => [x.name, known.get(x.name) && x.columns.includes(known.get(x.name)!) ? known.get(x.name)! : x.columns[0]!])));
      setSheets(s);
    } catch { toast.error("Could not read this Excel file"); }
  };

  const save = async () => {
    if (!sheets) return;
    try {
      for (const s of sheets) {
        setBusy(`${s.name}: starting…`);
        const n = await uploadSheet(s, keys[s.name]!, (d, t) => setBusy(`${s.name}: ${d} / ${t} rows`));
        toast.success(`${s.name}: ${n} rows saved`);
      }
      setSheets(null);
      await qc.invalidateQueries({ queryKey: ["sap-masters"] });
    } catch (e) { toast.error(`Upload failed: ${(e as Error).message}`); }
    finally { setBusy(null); }
  };

  return <div className="space-y-4">
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
      <div className="min-w-56">
        <div className="mb-1 text-xs text-muted-foreground">Select Sheet</div>
        <Select value={current?.id ?? ""} onValueChange={(v) => { setSelId(v); setPage(0); setSearch(""); }}>
          <SelectTrigger><SelectValue placeholder={masters.isLoading ? "Loading…" : "Upload Excel to see sheets"} /></SelectTrigger>
          <SelectContent>{(masters.data ?? []).map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Input className="max-w-xs" placeholder="Search…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
      {current && <div className="text-xs text-muted-foreground">{current.row_count} rows · {cols.length} columns · Key: {current.key_column} · Last upload {new Date(current.last_uploaded_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</div>}
      <div className="ml-auto flex gap-2">
        {current && <Button variant="outline" onClick={() => downloadMasterExcel(current.name, cols, filtered)}><Download className="mr-1 h-4 w-4" />Excel</Button>}
        {isAdmin && <>
          <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = ""; }} />
          <Button onClick={() => fileRef.current?.click()}><Upload className="mr-1 h-4 w-4" />Upload Excel</Button>
        </>}
      </div>
    </div>

    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted"><tr>{cols.map((c) => <th key={c} className="whitespace-nowrap px-3 py-2 text-left font-semibold">{c}</th>)}</tr></thead>
        <tbody>
          {view.map((r, i) => <tr key={i} className="border-t">{cols.map((c) => <td key={c} className="whitespace-nowrap px-3 py-1.5">{r[c] ?? ""}</td>)}</tr>)}
          {!view.length && <tr><td className="px-3 py-6 text-center text-muted-foreground" colSpan={Math.max(1, cols.length)}>{rows.isLoading ? "Loading…" : current ? "No rows" : isAdmin ? "Upload an Excel file to create your first master." : "No masters uploaded yet."}</td></tr>}
        </tbody>
      </table>
    </div>
    <div className="flex items-center gap-2 text-sm">
      <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</Button>
      <span>Page {page + 1} of {pages} · {filtered.length} rows</span>
      <Button size="sm" variant="outline" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next</Button>
    </div>

    <Dialog open={!!sheets} onOpenChange={(o) => { if (!o && !busy) setSheets(null); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Upload masters</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Each sheet becomes a master. New rows are added; rows with a matching key are updated.</p>
        <div className="max-h-80 space-y-3 overflow-y-auto">
          {sheets?.map((s) => <div key={s.name} className="rounded border p-3">
            <div className="font-medium">{s.name} <span className="text-xs text-muted-foreground">· {s.rows.length} rows · {s.columns.length} columns</span></div>
            <div className="mt-2 flex items-center gap-2 text-sm">Key column
              <Select value={keys[s.name] ?? ""} onValueChange={(v) => setKeys({ ...keys, [s.name]: v })}>
                <SelectTrigger className="h-8 w-48"><SelectValue /></SelectTrigger>
                <SelectContent>{s.columns.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>)}
        </div>
        {busy && <div className="text-sm">{busy}</div>}
        <DialogFooter><Button disabled={!!busy} onClick={save}>{busy ? "Saving…" : "Save"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
