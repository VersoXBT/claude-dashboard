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

interface PeakHoursChartProps {
  readonly hourCounts: Readonly<Record<string, number>>
  readonly isLoading?: boolean
}

interface HourDataPoint {
  readonly hour: string
  readonly label: string
  readonly sessions: number
}

function buildHourData(
  hourCounts: Readonly<Record<string, number>>
): readonly HourDataPoint[] {
  return Array.from({ length: 24 }, (_, i) => {
    const hour = String(i)
    const ampm = i === 0 ? "12a" : i < 12 ? `${i}a` : i === 12 ? "12p" : `${i - 12}p`
    return {
      hour,
      label: ampm,
      sessions: hourCounts[hour] ?? 0,
    }
  })
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  readonly active?: boolean
  readonly payload?: readonly { readonly value: number }[]
  readonly label?: string
}) {
  if (!active || !payload?.length) return null

  const hour = parseInt(label ?? "0", 10)
  const timeStr =
    hour === 0
      ? "12:00 AM"
      : hour < 12
        ? `${hour}:00 AM`
        : hour === 12
          ? "12:00 PM"
          : `${hour - 12}:00 PM`

  return (
    <div className="bg-[#2D2822] border border-[#3D3830] rounded-md px-3 py-2 text-xs shadow-lg">
      <div className="font-medium text-[#F5F0EB] mb-1">{timeStr}</div>
      <div className="text-[#B8AFA5]">{payload[0].value} sessions</div>
    </div>
  )
}

export function PeakHoursChart({
  hourCounts,
  isLoading = false,
}: PeakHoursChartProps) {
  const data = buildHourData(hourCounts)
  const isEmpty = data.every((d) => d.sessions === 0)

  return (
    <ChartContainer
      title="Peak Coding Hours"
      subtitle="Session distribution by hour of day"
      isLoading={isLoading}
      isEmpty={isEmpty}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#302C26" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#7A7267", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval={2}
          />
          <YAxis
            tick={{ fill: "#7A7267", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="sessions"
            fill={CHART_COLORS.tertiary}
            radius={[2, 2, 0, 0]}
            opacity={0.8}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
