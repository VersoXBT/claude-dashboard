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
import { TOKEN_COLORS, CHART_COLORS } from "@/components/charts/recharts-theme"
import type { IoRatioEntry } from "./use-cost-data"

interface IoRatioChartProps {
  readonly data: readonly IoRatioEntry[]
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

export function IoRatioChart({ data, isLoading }: IoRatioChartProps) {
  const sliced = data.slice(-30)

  return (
    <ChartContainer
      title="Input vs Output Ratio"
      subtitle="Daily input/output tokens with ratio overlay"
      isLoading={isLoading}
      isEmpty={sliced.length === 0}
      height="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={sliced} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 10, fill: "#71717a" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="left"
            tickFormatter={formatTokens}
            tick={{ fontSize: 11, fill: "#71717a" }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: "#71717a" }}
            axisLine={false}
            tickLine={false}
            width={40}
            domain={[0, "auto"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelFormatter={(label) => formatDate(String(label))}
            formatter={(value, name) => {
              if (String(name) === "ratio") return [`${Number(value).toFixed(2)}x`, "I/O Ratio"]
              const labels: Record<string, string> = {
                input: "Input Tokens",
                output: "Output Tokens",
              }
              return [formatTokens(Number(value)), labels[String(name)] ?? String(name)]
            }}
          />
          <Bar yAxisId="left" dataKey="input" fill={TOKEN_COLORS.input} opacity={0.7} />
          <Bar yAxisId="left" dataKey="output" fill={TOKEN_COLORS.output} opacity={0.7} />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="ratio"
            stroke={CHART_COLORS.quaternary}
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
