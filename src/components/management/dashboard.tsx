import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { DashboardHeader } from "./header";
import { KpiCard } from "./kpi-card";
import { ManagementAlerts } from "./alerts";
import {
  MainGroupTreemap,
  ParetoChart,
  SalesQuantityChart,
  SalesTrendChart,
  SegmentDonutChart,
  TopCustomers,
  TopProfitCentres,
} from "./charts";
import {
  buildManagementView,
  dataDateRange,
  emptyMgmtFilters,
  fetchSdLines,
  filterOptions,
  presetRange,
  type MgmtFilters,
  type RangePreset,
} from "@/lib/management-live";
import {
  readSharedSalesFilters,
  subscribeSharedSalesFilters,
  writeSharedSalesFilters,
} from "@/lib/shared-sales-filters";

export function ManagementDashboard() {
  const navigate = useNavigate();
  const [preset, setPreset] = useState<RangePreset>("All postings");
  const [filters, setFilters] = useState<MgmtFilters>(emptyMgmtFilters);

  const { data: rows, isLoading, error } = useQuery({
    queryKey: ["management-sd-lines"],
    queryFn: fetchSdLines,
    staleTime: 5 * 60 * 1000,
  });

  const bounds = useMemo(() => dataDateRange(rows ?? []), [rows]);
  const options = useMemo(() => filterOptions(rows ?? []), [rows]);

  // Set when a shared posting-date range was applied, so the preset effect
  // below does not immediately overwrite it with the "All postings" range.
  const sharedDatesApplied = useRef(false);

  useEffect(() => {
    const applyShared = (shared: ReturnType<typeof readSharedSalesFilters>) => {
      if (shared.from || shared.to) {
        sharedDatesApplied.current = true;
        setPreset("Custom range");
      }
      setFilters((prev) => ({
        ...prev,
        businessSegment: shared.segments[0] ?? "",
        customer: shared.customers[0] ?? "",
        profitCentre: shared.profitCentres[0] ?? "",
        ...(shared.from || shared.to ? { from: shared.from, to: shared.to } : {}),
      }));
    };
    applyShared(readSharedSalesFilters());
    return subscribeSharedSalesFilters(applyShared);
  }, []);

  // Keep the posting-date window in step with the chosen preset.
  useEffect(() => {
    if (!bounds.min || preset === "Custom range" || sharedDatesApplied.current) return;
    const range = presetRange(preset, bounds);
    setFilters((prev) =>
      prev.from === range.from && prev.to === range.to ? prev : { ...prev, ...range },
    );
  }, [preset, bounds.min, bounds.max]);

  const onPresetChange = (next: RangePreset) => {
    sharedDatesApplied.current = false;
    setPreset(next);
    if (next !== "Custom range" && bounds.min) {
      const range = presetRange(next, bounds);
      writeSharedSalesFilters({ ...readSharedSalesFilters(), from: range.from, to: range.to });
    }
  };

  const view = useMemo(
    () => (rows ? buildManagementView(rows, filters) : null),
    [rows, filters],
  );
  const openDrilldown = (selection: { month?: string; customer?: string; kpi?: string }) => {
    let month = "";
    if (selection.month) {
      const match = selection.month.match(/^([A-Za-z]{3})\s+(\d{2,4})$/);
      const yearPart = match?.[2];
      const year = yearPart ? (yearPart.length === 2 ? `20${yearPart}` : yearPart) : filters.to.slice(0, 4);
      const parsed = new Date(`${match?.[1] ?? selection.month} 1, ${year}`);
      if (!Number.isNaN(parsed.getTime())) month = `${year}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
    }
    navigate({
      to: "/reports/sd/drilldown",
      search: {
        month,
        customer: selection.customer ?? filters.customer,
        from: filters.from,
        to: filters.to,
        salesType: filters.salesType,
        segments: filters.businessSegment ? [filters.businessSegment] : [],
        profitCentres: filters.profitCentre ? [filters.profitCentre] : [],
        plants: filters.plant ? [filters.plant] : [],
        kpi: selection.kpi ?? "",
        src: selection.kpi ? "management" : "",
        q: "",
        page: 1,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <div>

        <DashboardHeader
          preset={preset}
          onPresetChange={onPresetChange}
          rangeLabel={view ? `${view.currentLabel} · ${view.lineCount.toLocaleString("en-IN")} postings` : "Loading postings…"}
          filters={filters}
          onFiltersChange={(next) => {
            const changedDates = next.from !== filters.from || next.to !== filters.to;
            if (changedDates) {
              sharedDatesApplied.current = false;
              setPreset("Custom range");
            }
            setFilters(next);
            writeSharedSalesFilters({
              segments: next.businessSegment ? [next.businessSegment] : [],
              customers: next.customer ? [next.customer] : [],
              profitCentres: next.profitCentre ? [next.profitCentre] : [],
              from: next.from,
              to: next.to,
            });
          }}
          options={options}
        />

        <main className="max-h-[calc(100vh-78px)] overflow-y-auto px-[18px] py-4">
          {error ? (
            <div className="grid min-h-[40vh] place-items-center rounded-xl border border-[#E5EAF1] bg-white text-[13px] text-[#DC2626]">
              Sales postings could not be loaded. Please try again.
            </div>
          ) : isLoading || !view ? (
            <div className="grid min-h-[40vh] place-items-center rounded-xl border border-[#E5EAF1] bg-white text-[13px] text-[#68738A]">
              Loading sales postings…
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {view.kpis.map((kpi) => (
                  <button
                    key={kpi.id}
                    type="button"
                    onClick={() => openDrilldown({ kpi: kpi.id })}
                    className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1769E8] rounded-xl"
                    aria-label={`View ${kpi.label} line items`}
                  >
                    <KpiCard kpi={kpi} comparisonLabel={view.comparisonLabel} />
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-3 xl:grid-cols-[45fr_27fr_28fr]">
                <SalesTrendChart
                  monthly={view.trendMonthly}
                  quarterly={view.trendQuarterly}
                  ytd={view.trendYtd}
                  currentLabel={view.currentLabel}
                  previousLabel={view.previousLabel}
                  onMonthSelect={(month) => openDrilldown({ month })}
                />
                <SegmentDonutChart data={view.segments} totalCr={view.totalCr} />
                <TopProfitCentres data={view.profitCentres} />
              </div>

              <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                <TopCustomers data={view.customers} onSelect={(customer) => openDrilldown({ customer })} />
                <ParetoChart data={view.pareto} />
                <MainGroupTreemap data={view.mainGroups} />
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <SalesQuantityChart data={view.salesQuantity} />
                <ManagementAlerts alerts={view.alerts} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
