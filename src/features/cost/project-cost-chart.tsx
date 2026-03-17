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
import { CHART_COLORS } from "@/components/charts/recharts-theme"
import type { ProjectResponse } from "@/lib/types"

interface ProjectCostChartProps {
  readonly projects: readonly ProjectResponse[]
  readonly isLoading: boolean
}

export function ProjectCostChart({ projects, isLoading }: ProjectCostChartProps) {
  const sorted = [...projects]
    .filter((p) => p.estimatedCost > 0)
    .sort((a, b) => b.estimatedCost - a.estimatedCost)
    .slice(0, 12)
    .map((p) => ({
      name: p.name.length > 20 ? `${p.name.slice(0, 18)}...` : p.name,
      cost: Math.round(p.estimatedCost * 100) / 100,
    }))

  return (
    <ChartContainer
      title="Cost per Project"
      subtitle="Top projects by estimated spend"
      isLoading={isLoading}
      isEmpty={sorted.length === 0}
      height="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v: number) => `$${v.toFixed(0)}`}
            tick={{ fontSize: 11, fill: "#71717a" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 11, fill: "#a1a1aa" }}
            axisLine={false}
            tickLine={false}
            width={110}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value) => [`$${Number(value).toFixed(2)}`, "Cost"]}
          />
          <Bar dataKey="cost" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
