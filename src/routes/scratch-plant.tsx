import { createFileRoute } from "@tanstack/react-router";
import { PlantPendingChart } from "@/components/plant-pending-chart";
import type { PlantPending } from "@/lib/open-sales-orders-plants";

export const Route = createFileRoute("/scratch-plant")({
  component: ScratchPlant,
});

const PLANTS: PlantPending[] = [
  { code: "1100", name: "HBL MUNDA", value: 854.76, quantity: 12000, count: 14, divisions: ["VZM — VRLA"] },
  { code: "1200", name: "HBL UP", value: 587.82, quantity: 9000, count: 11, divisions: ["VZM — CPD"] },
  { code: "1300", name: "HBL BHUJ", value: 503.45, quantity: 8000, count: 9, divisions: ["VZM — Scrap"] },
  { code: "1400", name: "HBL SHAMLI", value: 381.57, quantity: 7000, count: 8, divisions: ["VZM — VRLA"] },
  { code: "1500", name: "HBL DHAULEE", value: 366.07, quantity: 6500, count: 7, divisions: ["VZM — CPD"] },
  { code: "1550", name: "HBL JHANSI", value: 350.84, quantity: 6000, count: 6, divisions: ["VZM — VRLA"] },
  { code: "1600", name: "HBL VIZIANAGARAM", value: 301.74, quantity: 5500, count: 5, divisions: ["VZM — Scrap"] },
  { code: "1650", name: "HBL LUDHIANA", value: 290.64, quantity: 5000, count: 4, divisions: ["VZM — CPD"] },
  { code: "1700", name: "HBL SILVASSA", value: 252.39, quantity: 4500, count: 3, divisions: ["VZM — VRLA"] },
  { code: "1750", name: "HBL NCP", value: 246.31, quantity: 4000, count: 2, divisions: ["VZM — Scrap"] },
];

function ScratchPlant() {
  return <div className="orders-compact bg-background p-3">
    <div className="order-paired-charts grid grid-cols-1 gap-4">
      <div className="order-panel border border-border bg-card p-3">
        <h2 className="mb-2 text-sm font-semibold">Plant-wise Pending</h2>
        <PlantPendingChart plants={PLANTS} loading={false} />
      </div>
    </div>
  </div>;
}
