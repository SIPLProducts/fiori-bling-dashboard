import { useState } from "react";
import { ChevronDown, RotateCcw, SlidersHorizontal } from "lucide-react";
import { FilterField, FilterMultiSelect } from "@/components/filter-multi-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserAccess } from "@/lib/use-user-access";

const CODE_FIELDS = [
  ["distributionChannel", "Distribution Channel"],
  ["division", "Division"],
  ["plant", "Plant"],
  ["billingType", "Billing Type"],
  ["billingDate", "Billing Document Date"],
  ["billingDocument", "Billing Document"],
  ["billingCreationDate", "Billing Creation Date"],
  ["salesDocument", "Sales Document"],
  ["salesDocumentItem", "Sales Document Item"],
  ["customer", "Customer"],
  ["salesOffice", "Sales Office"],
  ["material", "Material code"],
  ["profitCenter", "Profit Center"],
  ["salesman", "Salesman"],
  ["materialType", "Material Type"],
  ["region", "Region"],
  ["paymentTerms", "Terms of Payment"],
] as const;
const DATE_KEYS = new Set(["billingDate", "billingCreationDate"]);

type DateRange = { mode: "single" | "range"; from: string; to: string };

export function SalesRegisterFilters() {
  const { data: access } = useUserAccess();
  const [open, setOpen] = useState(true);
  const [salesOrg, setSalesOrg] = useState("1000");
  const [codes, setCodes] = useState<Record<string, string[] | null>>({});
  const [dates, setDates] = useState<Record<string, DateRange>>({});
  const optionsFor = (key: string): string[] => {
    if (key === "plant") return access && !access.unrestricted ? access.plants : [];
    if (key === "profitCenter") return access && !access.unrestricted ? access.profitCenters : [];
    return [];
  };
  const active = (salesOrg !== "1000" ? 1 : 0)
    + Object.values(codes).filter((v) => v !== null && v !== undefined).length
    + Object.values(dates).filter((d) => d.from || d.to).length;
  const reset = () => { setSalesOrg("1000"); setCodes({}); setDates({}); };

  return <section className="rounded-xl border border-border bg-card shadow-sm">
    <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
      <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-2 text-xs font-semibold text-foreground" aria-expanded={open}>
        <SlidersHorizontal className="size-4 text-primary" />Smart Filters
        {active ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">{active} active</span> : null}
        <ChevronDown className={`size-4 transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>
      <Button type="button" variant="outline" size="sm" onClick={reset}><RotateCcw className="size-3.5" />Reset</Button>
    </div>
    {open ? <div className="grid grid-cols-1 gap-x-3 gap-y-2 p-3 sm:grid-cols-2 min-[900px]:grid-cols-4">
      <FilterField label="Sales Organization"><Input value={salesOrg} onChange={(e) => setSalesOrg(e.target.value)} className="h-9" /></FilterField>
      {CODE_FIELDS.map(([key, label]) => {
        if (DATE_KEYS.has(key)) {
          const d = dates[key] ?? { mode: "range", from: "", to: "" };
          const set = (next: Partial<DateRange>) => setDates({ ...dates, [key]: { ...d, ...next } });
          return <FilterField key={key} label={label}>
            <div className="flex gap-1">
              <select aria-label={`${label} mode`} value={d.mode} onChange={(e) => set({ mode: e.target.value as DateRange["mode"], to: "" })} className="h-9 rounded-sm border border-input bg-background px-1 text-xs">
                <option value="single">Single</option><option value="range">From–To</option>
              </select>
              <Input type="date" aria-label={`${label} from`} value={d.from} onChange={(e) => set({ from: e.target.value })} className="h-9 min-w-0 px-1 text-xs" />
              {d.mode === "range" ? <Input type="date" aria-label={`${label} to`} value={d.to} onChange={(e) => set({ to: e.target.value })} className="h-9 min-w-0 px-1 text-xs" /> : null}
            </div>
          </FilterField>;
        }
        return <FilterMultiSelect key={key} label={label} placeholder="All" options={optionsFor(key)} selected={codes[key] ?? null} onChange={(v) => setCodes({ ...codes, [key]: v })} />;
      })}
    </div> : null}
  </section>;
}
