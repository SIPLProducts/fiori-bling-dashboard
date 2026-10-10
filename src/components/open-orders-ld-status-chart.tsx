import { useId } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { summarizeLdStatus } from '@/lib/open-orders-ld-status';

export function OpenOrdersLdStatusChart({ data, pdf = false }: { data: ReturnType<typeof summarizeLdStatus>; pdf?: boolean }) {
  const gradient = useId().replace(/:/g, '');
  const formatValue = (value: number) => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr`;
  return <div className="order-ld-canvas" role="img" aria-label={data.map(row => `${row.status}: ${row.count} order lines, ${formatValue(row.value)}`).join('; ')}>
    <ResponsiveContainer width="100%" height={pdf ? 250 : '100%'}>
      <BarChart data={data} margin={{ top: 30, right: 12, left: 0, bottom: 8 }}>
        <defs>{['var(--success)', 'var(--destructive)'].map((color, index) => <linearGradient key={index} id={`${gradient}-${index}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`color-mix(in oklab, ${color} var(--order-gradient-light-share), var(--quick-view-value))`} />
          <stop offset="45%" stopColor={color} />
          <stop offset="100%" stopColor={`color-mix(in oklab, ${color} var(--order-gradient-deep-share), var(--foreground))`} />
        </linearGradient>)}</defs>
        <CartesianGrid vertical={false} stroke="var(--chart-grid-line)" />
        <XAxis dataKey="status" tick={{ fill: 'var(--card-foreground)', fontSize: 12 }} />
        <YAxis width={55} domain={[0, (maximum: number) => maximum > 0 ? maximum * 1.15 : 1]} tick={{ fill: 'var(--card-foreground)', fontSize: 10 }} label={{ value: 'Value (₹ Cr)', angle: -90, position: 'insideLeft', fill: 'var(--card-foreground)', fontSize: 10 }} />
        <Tooltip content={({ active, payload }) => {
          const row = payload?.[0]?.payload as typeof data[number] | undefined;
          return active && row ? <div className="rounded-md border border-border bg-popover p-2 text-xs text-popover-foreground shadow-tile"><strong>LD Status: {row.status}</strong><p>{row.count.toLocaleString('en-IN')} order lines</p><p>{formatValue(row.value)}</p></div> : null;
        }} />
        <Bar dataKey="value" name="Open Value" maxBarSize={48} radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {data.map((row, index) => <Cell key={row.status} fill={`url(#${gradient}-${index})`} />)}
          <LabelList dataKey="value" position="top" formatter={(value: number) => value.toFixed(2)} className="fill-foreground text-[11px]" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>;
}
