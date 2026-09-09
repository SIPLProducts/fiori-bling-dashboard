import {
  ArrowDownRight,
  ArrowUpRight,
  IndianRupee,
  LineChart,
  Package,
  Target,
  User,
  Users,
} from "lucide-react";
import { COMPARISON_LABEL, type KpiDatum } from "@/lib/management-data";

const ICONS = {
  rupee: IndianRupee,
  growth: LineChart,
  package: Package,
  users: Users,
  target: Target,
  user: User,
} as const;

export function KpiCard({ kpi }: { kpi: KpiDatum }) {
  const Icon = ICONS[kpi.icon];
  const positive = kpi.delta >= 0;
  const Arrow = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="rounded-xl border border-[#E5EAF1] bg-white p-4 shadow-[0_1px_2px_rgba(16,27,61,0.04)] transition-colors hover:border-[#CFDCEC]">
      <div className="flex items-start gap-3">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
          style={{ backgroundColor: kpi.tint }}
        >
          <Icon className="h-[18px] w-[18px]" style={{ color: kpi.iconColor }} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[12px] font-medium text-[#68738A]" title={kpi.label}>
            {kpi.label}
          </p>
          <p className="mt-1 text-[21px] font-bold leading-tight text-[#101B3D]">{kpi.value}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 text-[11px]">
        <Arrow
          className={`h-3.5 w-3.5 shrink-0 ${positive ? "text-[#16A34A]" : "text-[#DC2626]"}`}
        />
        <span className={`font-semibold ${positive ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
          {Math.abs(kpi.delta).toFixed(1)}%
        </span>
        <span className="truncate text-[#68738A]">{COMPARISON_LABEL}</span>
      </div>
    </div>
  );
}
