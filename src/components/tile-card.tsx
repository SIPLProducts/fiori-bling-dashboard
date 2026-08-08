import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Clock,
  FileText,
  Grid3x3,
  LayoutList,
  PieChart,
  ShoppingCart,
  Star,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import type { TileRecord } from "@/lib/sap.functions";

const ICONS: Record<string, typeof Grid3x3> = {
  grid: Grid3x3,
  doc: FileText,
  list: LayoutList,
  users: Users,
  cart: ShoppingCart,
  currency: Wallet,
  trend: TrendingUp,
  savings: BadgeCheck,
  star: Star,
  clock: Clock,
  alert: AlertTriangle,
  check: CheckCircle2,
  pie: PieChart,
};

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = 100 / (points.length - 1);
  const bars = points.map((p, i) => ({
    x: i * step,
    h: 8 + ((p - min) / span) * 26,
  }));
  return (
    <svg viewBox="0 0 100 36" className="h-9 w-full" preserveAspectRatio="none" aria-hidden="true">
      {bars.map((bar) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={36 - bar.h}
          width={step * 0.62}
          height={bar.h}
          rx="0.8"
          className="fill-primary/70"
        />
      ))}
    </svg>
  );
}

function formatValue(value: number) {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(2)}K`;
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/** KPI tiles drill into the PO report pre-filtered on the matching status. */
const PO_FOCUS: Record<string, string> = {
  po_overdue: "Overdue",
  pending_confirmations: "Open",
  pending_approvals: "Blocked",
};

export function TileCard({

  tile,
  kpi,
}: {
  tile: TileRecord;
  kpi: { value: number; unit?: string; footer?: string; trend?: number[] } | undefined;
}) {
  const Icon = ICONS[tile.icon] ?? Grid3x3;
  const to = tile.target_path ?? "/launchpad";


  const body = (
    <div className="flex h-[152px] w-full flex-col justify-between rounded-md border border-border bg-card p-4 text-left shadow-tile transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-tile-hover">
      <div>
        <div className="line-clamp-2 text-[15px] leading-snug font-medium text-card-foreground">
          {tile.title}
        </div>
        {tile.subtitle ? (
          <div className="mt-0.5 text-xs text-muted-foreground">{tile.subtitle}</div>
        ) : null}
      </div>

      {tile.kind === "kpi" && kpi ? (
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="tabular text-[32px] leading-none font-light text-primary">
              {formatValue(kpi.value)}
            </span>
            {kpi.unit ? <span className="text-xs text-muted-foreground">{kpi.unit}</span> : null}
          </div>
          <div className="mt-2 border-t border-border pt-1.5 text-[11px] text-muted-foreground">
            {kpi.footer ?? tile.subtitle}
          </div>
        </div>
      ) : tile.kind === "chart" && kpi?.trend ? (
        <div>
          <Sparkline points={kpi.trend} />
          <div className="mt-1 border-t border-border pt-1.5 text-[11px] text-muted-foreground">
            {kpi.footer ?? tile.subtitle}
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <Icon className="size-6 text-primary/80" strokeWidth={1.5} />
        </div>
      )}
    </div>
  );

  if (to.startsWith("/reports/module/")) {
    const moduleKey = to.split("/").pop()!;
    return (
      <Link
        to="/reports/module/$module"
        params={{ module: moduleKey }}
        className="block focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {body}
      </Link>
    );
  }
  if (to === "/reports/purchase-orders") {
    const focus = PO_FOCUS[tile.kpi_key ?? ""];
    return (
      <Link
        to="/reports/purchase-orders"
        search={focus ? { focus } : {}}
        className="block focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {body}
      </Link>
    );
  }
  if (to === "/reports/procurement" || to === "/reports/suppliers" || to === "/admin/users") {
    return (
      <Link to={to} className="block focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
        {body}
      </Link>
    );
  }
  return <div>{body}</div>;

}
