import { useState } from "react";
import { Sidebar, type NavId, NAV_ITEMS } from "./sidebar";
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
import { kpiData } from "@/lib/management-data";

export function ManagementDashboard() {
  const [active, setActive] = useState<NavId>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [range, setRange] = useState("Jan 2025 - Aug 2026");

  const activeLabel =
    active === "settings"
      ? "Settings"
      : (NAV_ITEMS.find((item) => item.id === active)?.label ?? "Dashboard");

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <Sidebar
        active={active}
        onSelect={(id) => {
          setActive(id);
          setMenuOpen(false);
        }}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <div className="lg:pl-[116px]">
        <DashboardHeader
          range={range}
          onRangeChange={setRange}
          onMenuClick={() => setMenuOpen((prev) => !prev)}
        />

        <main className="max-h-[calc(100vh-78px)] overflow-y-auto px-[18px] py-4">
          {active !== "dashboard" ? (
            <div className="grid min-h-[60vh] place-items-center rounded-xl border border-[#E5EAF1] bg-white">
              <div className="text-center">
                <p className="text-[18px] font-semibold text-[#101B3D]">{activeLabel}</p>
                <p className="mt-1 text-[13px] text-[#68738A]">
                  This section is coming soon. Select Dashboard to return to the executive overview.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {kpiData.map((kpi) => (
                  <KpiCard key={kpi.id} kpi={kpi} />
                ))}
              </div>

              <div className="grid grid-cols-1 gap-3 xl:grid-cols-[45fr_27fr_28fr]">
                <SalesTrendChart />
                <SegmentDonutChart />
                <TopProfitCentres />
              </div>

              <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                <TopCustomers />
                <ParetoChart />
                <MainGroupTreemap />
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <SalesQuantityChart />
                <ManagementAlerts />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
