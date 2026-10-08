import { useEffect, useRef, useState } from "react";

export const ORDER_CHART_COLORS = ["var(--chart-1)", "var(--chart-3)", "var(--chart-4)", "var(--quick-view-violet)", "var(--chart-2)", "var(--kpi-6)"];

export function OrderChartGradients({ id }: { id: string }) {
  return <defs>{ORDER_CHART_COLORS.map((color, index) => <linearGradient key={color} id={`${id}-${index}`} x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor={`color-mix(in oklab, ${color} var(--order-gradient-light-share), var(--quick-view-value))`} />
    <stop offset="40%" stopColor={color} />
    <stop offset="100%" stopColor={`color-mix(in oklab, ${color} var(--order-gradient-deep-share), var(--foreground))`} />
  </linearGradient>)}</defs>;
}

export function useChartWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}