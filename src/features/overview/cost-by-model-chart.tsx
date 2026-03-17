"use client"

import { useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { ChartContainer } from "@/components/charts/chart-container"
import {
  getModelColor,
  getModelDisplayName,
} from "@/components/charts/recharts-theme"
import { getPricingForModel } from "@/lib/costs"
import type { DailyModelTokens } from "@/lib/types"

interface CostByModelChartProps {
  readonly dailyModelTokens: readonly DailyModelTokens[]
}

function formatCost(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`
  if (n >= 1) return `$${n.toFixed(2)}`
  return `$${n.toFixed(3)}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function CostByModelChart({ dailyModelTokens }: CostByModelChartProps) {
  const { chartData, modelKeys } = useMemo(() => {
    const allModels = new Set<string>()
    for (const day of dailyModelTokens) {
      for (const model of Object.keys(day.tokensByModel)) {
        allModels.add(model)
      }
    }

    const sorted = [...dailyModelTokens].sort((a, b) =>
      a.date.localeCompare(b.date)
    )

    const last30 = sorted.slice(-30)

    const data = last30.map((day) => {
      const entry: Record<string, string | number> = { date: day.date }
      for (const model of allModels) {
        const tokens = day.tokensByModel[model] ?? 0
        const pricing = getPricingForModel(model)
        entry[model] = Number(
          ((tokens / 1_000_000) * pricing.outputPerMTok).toFixed(4)
        )
      }
      return entry
    })

    return { chartData: data, modelKeys: Array.from(allModels) }
  }, [dailyModelTokens])

  return (
    <ChartContainer
      title="Cost by Model"
      subtitle="Daily estimated cost per model"
      height="h-[350px]"
      isEmpty={chartData.length === 0}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#52525b"
            tick={{ fontSize: 11, fill: "#71717a" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={formatCost}
            stroke="#52525b"
            tick={{ fontSize: 11, fill: "#71717a" }}
            axisLine={false}
            tickLine={false}
            width={55}
          />
          <RechartsTooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#a1a1aa" }}
            itemStyle={{ color: "#e4e4e7" }}
            labelFormatter={(label) => formatDate(String(label))}
            formatter={(value, name) => [
              formatCost(Number(value)),
              getModelDisplayName(String(name)),
            ]}
          />
          <Legend
            iconType="rect"
            iconSize={10}
            formatter={(value: string) => getModelDisplayName(value)}
            wrapperStyle={{ fontSize: "11px", color: "#a1a1aa" }}
          />
          {modelKeys.map((model) => (
            <Bar
              key={model}
              dataKey={model}
              stackId="cost"
              fill={getModelColor(model)}
              radius={[2, 2, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
