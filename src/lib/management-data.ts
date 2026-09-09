/**
 * Static, realistic dummy data for the Management Sales Dashboard.
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

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const CURRENT = [32, 31, 37, 46, 43, 43, 57, 61, 65, 63, 56, 46];
const PREVIOUS = [21, 18, 23, 32, 27, 28, 37, 39, 44, 48, 42, 46];

export const salesTrendData: TrendPoint[] = MONTHS.map((month, i) => ({
  month,
  current: CURRENT[i] ?? 0,
  previous: PREVIOUS[i] ?? 0,
}));

export const salesTrendQuarterly: TrendPoint[] = [
  { month: "Q1", current: 100, previous: 62 },
  { month: "Q2", current: 132, previous: 87 },
  { month: "Q3", current: 183, previous: 120 },
  { month: "Q4", current: 165, previous: 136 },
];

export const salesTrendYtd: TrendPoint[] = MONTHS.reduce<TrendPoint[]>((acc, month, i) => {
  const prevRow = acc[i - 1];
  acc.push({
    month,
    current: (prevRow?.current ?? 0) + (CURRENT[i] ?? 0),
    previous: (prevRow?.previous ?? 0) + (PREVIOUS[i] ?? 0),
  });
  return acc;
}, []);

export const segmentData: SegmentSlice[] = [
  { name: "Segment A", value: 145.68, pct: 34.9, color: CHART_COLORS.blue },
  { name: "Segment B", value: 112.29, pct: 26.9, color: CHART_COLORS.teal },
  { name: "Segment C", value: 75.55, pct: 18.1, color: CHART_COLORS.purple },
  { name: "Segment D", value: 44.25, pct: 10.6, color: CHART_COLORS.orange },
  { name: "Segment E", value: 25.88, pct: 6.2, color: CHART_COLORS.yellow },
  { name: "Segment F", value: 13.77, pct: 3.3, color: CHART_COLORS.gray },
];

export const profitCentreData: NamedValue[] = [
  { name: "Profit Centre 01", value: 38.24 },
  { name: "Profit Centre 02", value: 29.41 },
  { name: "Profit Centre 03", value: 22.17 },
  { name: "Profit Centre 04", value: 18.64 },
  { name: "Profit Centre 05", value: 15.32 },
  { name: "Profit Centre 06", value: 12.88 },
  { name: "Profit Centre 07", value: 9.67 },
  { name: "Profit Centre 08", value: 8.21 },
  { name: "Profit Centre 09", value: 6.45 },
  { name: "Profit Centre 10", value: 5.34 },
];

export const customerData: NamedValue[] = [
  { name: "Customer A", value: 25.31 },
  { name: "Customer B", value: 18.72 },
  { name: "Customer C", value: 15.68 },
  { name: "Customer D", value: 12.91 },
  { name: "Customer E", value: 11.24 },
  { name: "Customer F", value: 9.87 },
  { name: "Customer G", value: 8.56 },
  { name: "Customer H", value: 7.65 },
  { name: "Customer I", value: 6.31 },
  { name: "Customer J", value: 5.42 },
];

export const paretoData: ParetoPoint[] = [
  { name: "Top 10", amount: 116.88, cumulative: 28 },
  { name: "Top 20", amount: 75.14, cumulative: 46 },
  { name: "Top 30", amount: 58.44, cumulative: 60 },
  { name: "Top 50", amount: 75.14, cumulative: 78 },
  { name: "Top 100", amount: 54.26, cumulative: 91 },
  { name: "Others", amount: 37.56, cumulative: 100 },
];

export const mainGroupData: MainGroupBlock[] = [
  { name: "Main Group A", amount: 126.34, pct: 30.3, color: CHART_COLORS.blue },
  { name: "Main Group B", amount: 98.67, pct: 23.6, color: CHART_COLORS.teal },
  { name: "Main Group C", amount: 76.21, pct: 18.3, color: CHART_COLORS.purple },
  { name: "Main Group D", amount: 55.34, pct: 13.3, color: CHART_COLORS.orange },
  { name: "Main Group E", amount: 38.21, pct: 9.2, color: CHART_COLORS.yellow },
  { name: "Others", amount: 22.65, pct: 5.4, color: CHART_COLORS.gray },
];

export const salesQuantityData: SalesQtyPoint[] = [
  { month: "Jan", amount: 40, quantity: 11 },
  { month: "Feb", amount: 51, quantity: 14 },
  { month: "Mar", amount: 57, quantity: 17 },
  { month: "Apr", amount: 72, quantity: 21 },
  { month: "May", amount: 71, quantity: 21 },
  { month: "Jun", amount: 88, quantity: 29 },
  { month: "Jul", amount: 96, quantity: 34 },
  { month: "Aug", amount: 86, quantity: 30 },
];

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

export const kpiData: KpiDatum[] = [
  { id: "sales", label: "Total Sales (Amount)", value: "₹ 417.42 Cr", delta: 12.6, icon: "rupee", tint: "#E8F0FE", iconColor: "#1769E8" },
  { id: "growth", label: "Sales Growth %", value: "12.6%", delta: 12.6, icon: "growth", tint: "#E6F6EC", iconColor: "#16A34A" },
  { id: "qty", label: "Total Quantity", value: "28.81 Lakhs", delta: 8.7, icon: "package", tint: "#F1EBFA", iconColor: "#7251B5" },
  { id: "cust", label: "Active Customers", value: "1,399", delta: 5.4, icon: "users", tint: "#FDF0DC", iconColor: "#F59E0B" },
  { id: "ah", label: "Revenue / AH", value: "₹ 2,102", delta: 9.5, icon: "target", tint: "#E2F5F5", iconColor: "#20A8A8" },
  { id: "arpc", label: "Avg. Revenue / Customer", value: "₹ 29.83 L", delta: 6.8, icon: "user", tint: "#EDEBFB", iconColor: "#6366F1" },
];

export const DATE_RANGES = [
  "Jan 2025 - Aug 2026",
  "Previous Year",
  "Current Year",
  "Custom Range",
];

export const FILTER_FIELDS = [
  "Sales Organization",
  "Region",
  "Segment",
  "Customer",
  "Product",
  "Profit Centre",
  "Main Group",
];
