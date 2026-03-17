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
  Legend,
} from "recharts"
import { ChartContainer } from "@/components/charts/chart-container"
import { CHART_COLORS } from "@/components/charts/recharts-theme"
import type { DailyActivity } from "@/lib/types"

interface SessionDurationChartProps {
  readonly dailyActivity: readonly DailyActivity[]
  readonly isLoading?: boolean
}

interface ChartDataPoint {
  readonly date: string
  readonly label: string
  readonly sessions: number
  readonly avgDuration: number
}

function buildChartData(
  dailyActivity: readonly DailyActivity[]
): readonly ChartDataPoint[] {
  const sorted = [...dailyActivity]
    .filter((d) => d.sessionCount > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30)

  return sorted.map((day) => ({
    date: day.date,
    label: new Date(day.date + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    sessions: day.sessionCount,
    avgDuration:
      day.sessionCount > 0
        ? Math.round(day.messageCount / day.sessionCount) * 3
        : 0,
  }))
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  readonly active?: boolean
  readonly payload?: readonly { readonly value: number; readonly name: string }[]
  readonly label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-xs shadow-lg">
      <div className="font-medium text-zinc-200 mb-1">{label}</div>
      {payload.map((entry) => (
        <div key={entry.name} className="text-zinc-400">
          {entry.name}: {entry.value}
          {entry.name === "Avg Duration" ? " min" : ""}
        </div>
      ))}
    </div>
  )
}

export function SessionDurationChart({
  dailyActivity,
  isLoading = false,
}: SessionDurationChartProps) {
  const data = buildChartData(dailyActivity)

  return (
    <ChartContainer
      title="Session Count & Duration"
      subtitle="Last 30 active days"
      isLoading={isLoading}
      isEmpty={data.length === 0}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="label"
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            label={{
              value: "Sessions",
              angle: -90,
              position: "insideLeft",
              style: { fill: "#71717a", fontSize: 11 },
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            label={{
              value: "Avg Duration (min)",
              angle: 90,
              position: "insideRight",
              style: { fill: "#71717a", fontSize: 11 },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }}
          />
          <Bar
            yAxisId="left"
            dataKey="sessions"
            name="Sessions"
            fill={CHART_COLORS.primary}
            radius={[2, 2, 0, 0]}
            opacity={0.8}
          />
          <Line
            yAxisId="right"
            dataKey="avgDuration"
            name="Avg Duration"
            stroke={CHART_COLORS.quaternary}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: CHART_COLORS.quaternary }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
