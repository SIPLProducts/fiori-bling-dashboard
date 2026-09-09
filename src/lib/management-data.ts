/**
 * Shared types and chart colors for the Management Sales Dashboard (data comes from live postings).
 * Values mirror the executive reference report.
 */

export type TrendPoint = { month: string; current: number; previous: number };
export type NamedValue = { name: string; value: number };
export type ParetoPoint = { name: string; amount: number; cumulative: number };
export type SegmentSlice = { name: string; value: number; pct: number; color: string };
export type MainGroupBlock = { name: string; amount: number; pct: number; color: string };
export type SalesQtyPoint = { month: string; amount: number; quantity: number };

export const CHART_COLORS = {
  blue: "#1769E8",
  teal: "#20A8A8",
  purple: "#7251B5",
  orange: "#F59E0B",
  yellow: "#FBBF24",
  gray: "#94A3B8",
  green: "#16A34A",
  navy: "#052B55",
} as const;


export type AlertTone = "negative" | "warning" | "positive";
export type ManagementAlert = {
  id: string;
  tone: AlertTone;
  category: "Sales" | "Customer" | "Profit Centre";
  before: string;
  highlight: string;
  after: string;
  detail?: string;
};

export const COMPARISON_LABEL = "vs Jan 2024 - Aug 2025";

export type KpiDatum = {
  id: string;
  label: string;
  value: string;
  delta: number;
  icon: "rupee" | "growth" | "package" | "users" | "target" | "user";
  tint: string;
  iconColor: string;
};
