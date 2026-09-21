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
  ArrowRight,
} from "lucide-react";
import type { TileRecord } from "@/lib/sap.functions";
import { NetSalesLaunchCard } from "@/components/net-sales-launch-card";

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

function actionLabel(tile: TileRecord) {
  if (tile.kind === "chart") return "View analytics";
  if (tile.kind === "kpi") return "View details";
  if (tile.target_path?.startsWith("/tables/")) return "Open table";
  return "Open report";
}

function TileAction({ label }: { label: string }) {
  return (
    <div className="-mx-4 -mb-4 mt-3 flex min-h-9 items-center justify-between border-t border-border/70 bg-launchpad-tile-footer px-4 text-[11px] font-semibold text-primary">
      <span>{label}</span>
      <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
    </div>
  );
}

export function TileCard({

  tile,
  kpi,
}: {
  tile: TileRecord;
  kpi: { value: number; unit?: string; footer?: string; trend?: number[] } | undefined;
}) {
  const Icon = ICONS[tile.icon] ?? Grid3x3;
  const to = tile.target_path ?? "/launchpad";

  // The plain SD launch tile is replaced by the live Total Sales card,
  // falling back to the original tile look if live data is unavailable.
  if (tile.kind === "launch" && to === "/reports/module/sd") {
    const fallback = (
      <Link
        to="/reports/module/$module"
        params={{ module: "sd" }}
        className="group block rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <div className="flex h-[176px] w-full flex-col overflow-hidden rounded-md border border-border/80 bg-launchpad-tile p-4 text-left shadow-launchpad-tile transition-all duration-150 group-hover:-translate-y-0.5 group-hover:border-primary/35 group-hover:shadow-tile-hover motion-reduce:transform-none">
          <div>
            <div className="line-clamp-2 text-[15px] leading-snug font-medium text-card-foreground">
              {tile.title}
            </div>
            {tile.subtitle ? (
              <div className="mt-0.5 text-xs text-muted-foreground">{tile.subtitle}</div>
            ) : null}
          </div>
          <div className="mt-auto flex justify-end">
            <span className="grid size-9 place-items-center rounded-md bg-primary/10 text-primary">
              <Icon className="size-4" strokeWidth={1.7} />
            </span>
          </div>
          <TileAction label={actionLabel(tile)} />
        </div>
      </Link>
    );
    return <NetSalesLaunchCard fallback={fallback} />;
  }




  const body = (
    <div className="flex h-[176px] w-full flex-col overflow-hidden rounded-md border border-border/80 bg-launchpad-tile p-4 text-left shadow-launchpad-tile transition-all duration-150 group-hover:-translate-y-0.5 group-hover:border-primary/35 group-hover:shadow-tile-hover motion-reduce:transform-none">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
        <div className="line-clamp-2 text-[15px] leading-snug font-medium text-card-foreground">
          {tile.title}
        </div>
        {tile.subtitle ? (
          <div className="mt-0.5 text-xs text-muted-foreground">{tile.subtitle}</div>
        ) : null}
        </div>
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-4" strokeWidth={1.7} />
        </span>
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
        <div className="flex-1" />
      )}
      {to !== "/launchpad" ? <TileAction label={actionLabel(tile)} /> : null}
    </div>
  );

  if (to.startsWith("/reports/module/")) {
    if (tile.kpi_key === "sd_open_orders") {
      return (
        <Link
          to="/reports/sd/open-sales-orders"
          className="group block rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {body}
        </Link>
      );
    }
    const moduleKey = to.split("/").pop()!;
    return (
      <Link
        to="/reports/module/$module"
        params={{ module: moduleKey }}
        className="group block rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        {body}
      </Link>
    );
  }
  if (to.startsWith("/tables/")) {
    const key = to.split("/").pop()!;
    return (
      <Link
        to="/tables/$tableKey"
        params={{ tableKey: key }}
        className="group block rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        {body}
      </Link>
    );
  }
  if (
    to === "/reports/sales-analytics" ||
    to === "/reports/sd/kpi" ||
    to === "/reports/sd/finance-gst" ||
    to === "/reports/sd/register" ||
    to === "/admin/users"
  ) {

    return (
      <Link to={to} className="group block rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none">
        {body}
      </Link>
    );
  }

  return <div>{body}</div>;

}
