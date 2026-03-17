"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer } from "@/components/charts/chart-container"
import { TOKEN_COLORS, CHART_GRID_COLOR, CHART_AXIS_COLOR, TOOLTIP_STYLE } from "@/components/charts/recharts-theme"
import type { TokenCategoryEntry } from "./use-cost-data"

interface TokenCategoriesChartProps {
  readonly data: readonly TokenCategoryEntry[]
  readonly isLoading: boolean
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

export function TokenCategoriesChart({ data, isLoading }: TokenCategoriesChartProps) {
  const sliced = data.slice(-30)

  return (
    <ChartContainer
      title="Token Categories"
      subtitle="Daily token breakdown by type"
      isLoading={isLoading}
      isEmpty={sliced.length === 0}
      height="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sliced} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
            tickFormatter={formatTokens}
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
              const labels: Record<string, string> = {
                input: "Input",
                output: "Output",
                cacheRead: "Cache Read",
                cacheCreation: "Cache Creation",
              }
              return [formatTokens(Number(value)), labels[String(name)] ?? String(name)]
            }}
          />
          <Bar dataKey="input" stackId="tokens" fill={TOKEN_COLORS.input} radius={[0, 0, 0, 0]} />
          <Bar dataKey="output" stackId="tokens" fill={TOKEN_COLORS.output} radius={[0, 0, 0, 0]} />
          <Bar dataKey="cacheRead" stackId="tokens" fill={TOKEN_COLORS.cacheRead} radius={[0, 0, 0, 0]} />
          <Bar dataKey="cacheCreation" stackId="tokens" fill={TOKEN_COLORS.cacheCreation} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
