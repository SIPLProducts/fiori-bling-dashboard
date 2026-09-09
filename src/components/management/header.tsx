import { useState } from "react";
import { CalendarDays, ChevronDown, Filter, Menu } from "lucide-react";
import {
  FILTER_DEFS,
  RANGE_PRESETS,
  emptyMgmtFilters,
  type MgmtFilters,
  type RangePreset,
} from "@/lib/management-live";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  preset: RangePreset;
  onPresetChange: (preset: RangePreset) => void;
  rangeLabel: string;
  filters: MgmtFilters;
  onFiltersChange: (filters: MgmtFilters) => void;
  options: Record<string, string[]>;
  onMenuClick: () => void;
};

const controlClass =
  "flex h-10 items-center gap-2 rounded-lg border border-[#E5EAF1] bg-white px-3 text-[13px] font-medium text-[#101B3D] transition-colors hover:bg-[#F7F9FC]";

const ALL = "__all__";

export function DashboardHeader({
  preset,
  onPresetChange,
  rangeLabel,
  filters,
  onFiltersChange,
  options,
  onMenuClick,
}: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState<MgmtFilters>(filters);

  const open = (next: boolean) => {
    if (next) setDraft(filters);
    setFiltersOpen(next);
  };

  const activeCount = FILTER_DEFS.filter((def) => filters[def.key]).length;

  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-[#E5EAF1] bg-[#F7F9FC] px-[18px] py-4">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Toggle menu"
          className="shrink-0 rounded-md p-1.5 text-[#101B3D] hover:bg-[#EEF2F8]"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-[24px] font-bold leading-tight text-[#101B3D]">
            Management Sales Dashboard
          </h1>
          <p className="truncate text-[13px] text-[#68738A]">Executive Overview · {rangeLabel}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger className={controlClass}>
            <CalendarDays className="h-4 w-4 text-[#68738A]" />
            <span className="hidden sm:inline">{preset}</span>
            <ChevronDown className="h-4 w-4 text-[#68738A]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {RANGE_PRESETS.map((option) => (
              <DropdownMenuItem
                key={option}
                onSelect={() => {
                  onPresetChange(option);
                  if (option === "Custom range") open(true);
                }}
              >
                {option}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button type="button" className={controlClass} onClick={() => open(true)}>
          <Filter className="h-4 w-4 text-[#68738A]" />
          <span className="hidden sm:inline">Filters{activeCount ? ` (${activeCount})` : ""}</span>
        </button>
      </div>

      <Dialog open={filtersOpen} onOpenChange={open}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <label className="mb-1 block text-[12px] font-medium text-[#68738A]">
                Posting from
              </label>
              <Input
                type="date"
                value={draft.from}
                onChange={(event) => setDraft({ ...draft, from: event.target.value })}
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1 block text-[12px] font-medium text-[#68738A]">Posting to</label>
              <Input
                type="date"
                value={draft.to}
                onChange={(event) => setDraft({ ...draft, to: event.target.value })}
              />
            </div>

            {FILTER_DEFS.map((def) => (
              <div key={def.key} className="min-w-0">
                <label className="mb-1 block text-[12px] font-medium text-[#68738A]">
                  {def.label}
                </label>
                <Select
                  value={draft[def.key] || ALL}
                  onValueChange={(value) =>
                    setDraft({ ...draft, [def.key]: value === ALL ? "" : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`All ${def.label}`} />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value={ALL}>All {def.label}</SelectItem>
                    {(options[def.key] ?? []).map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDraft({ ...emptyMgmtFilters, from: draft.from, to: draft.to })}
            >
              Reset
            </Button>
            <Button
              onClick={() => {
                onFiltersChange(draft);
                setFiltersOpen(false);
              }}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
