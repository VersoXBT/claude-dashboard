"use client"

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer } from "@/components/charts/chart-container"
import { CHART_COLORS, CHART_GRID_COLOR, CHART_AXIS_COLOR, TOOLTIP_STYLE } from "@/components/charts/recharts-theme"
import type { CacheRoiEntry } from "./use-cost-data"

interface CacheRoiChartProps {
  readonly data: readonly CacheRoiEntry[]
  readonly isLoading: boolean
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function CacheRoiChart({ data, isLoading }: CacheRoiChartProps) {
  const sliced = data.slice(-30)

  return (
    <ChartContainer
      title="Cache ROI"
      subtitle="Cache hit rate and estimated savings"
      isLoading={isLoading}
      isEmpty={sliced.length === 0}
      height="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={sliced} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 10, fill: CHART_AXIS_COLOR }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="left"
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 11, fill: CHART_AXIS_COLOR }}
            axisLine={false}
            tickLine={false}
            width={45}
            domain={[0, 100]}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(v: number) => `$${v.toFixed(0)}`}
            tick={{ fontSize: 11, fill: CHART_AXIS_COLOR }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: TOOLTIP_STYLE.backgroundColor,
              border: `1px solid ${TOOLTIP_STYLE.borderColor}`,
              borderRadius: TOOLTIP_STYLE.borderRadius,
              fontSize: "12px",
            }}
            labelFormatter={(label) => formatDate(String(label))}
            formatter={(value, name) => {
              if (String(name) === "hitRate") return [`${Number(value).toFixed(1)}%`, "Cache Hit Rate"]
              return [`$${Number(value).toFixed(2)}`, "Est. Savings"]
            }}
          />
          <Bar
            yAxisId="right"
            dataKey="savings"
            fill={CHART_COLORS.success}
            opacity={0.5}
            radius={[2, 2, 0, 0]}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="hitRate"
            stroke={CHART_COLORS.secondary}
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
