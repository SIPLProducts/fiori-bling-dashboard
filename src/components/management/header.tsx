import { useState } from "react";
import { CalendarDays, ChevronDown, Filter, Menu } from "lucide-react";
import { DATE_RANGES, FILTER_FIELDS } from "@/lib/management-data";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  range: string;
  onRangeChange: (range: string) => void;
  onMenuClick: () => void;
};

const controlClass =
  "flex h-10 items-center gap-2 rounded-lg border border-[#E5EAF1] bg-white px-3 text-[13px] font-medium text-[#101B3D] transition-colors hover:bg-[#F7F9FC]";

export function DashboardHeader({ range, onRangeChange, onMenuClick }: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});

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
          <p className="truncate text-[13px] text-[#68738A]">Executive Overview</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger className={controlClass}>
            <CalendarDays className="h-4 w-4 text-[#68738A]" />
            <span className="hidden sm:inline">{range}</span>
            <ChevronDown className="h-4 w-4 text-[#68738A]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {DATE_RANGES.map((option) => (
              <DropdownMenuItem key={option} onSelect={() => onRangeChange(option)}>
                {option}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button type="button" className={controlClass} onClick={() => setFiltersOpen(true)}>
          <Filter className="h-4 w-4 text-[#68738A]" />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {FILTER_FIELDS.map((field) => (
              <div key={field} className="min-w-0">
                <label className="mb-1 block text-[12px] font-medium text-[#68738A]">
                  {field}
                </label>
                <Input
                  value={filters[field] ?? ""}
                  placeholder={`Enter ${field}`}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, [field]: event.target.value }))
                  }
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFilters({})}>
              Reset
            </Button>
            <Button onClick={() => setFiltersOpen(false)}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
