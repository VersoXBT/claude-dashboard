"use client"

import { useState, useMemo } from "react"
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer } from "@/components/charts/chart-container"
import { CHART_COLORS, CHART_GRID_COLOR, CHART_AXIS_COLOR, TOOLTIP_STYLE } from "@/components/charts/recharts-theme"
import { CLAUDE_COLORS } from "@/lib/theme"
import type { DailyCostEntry } from "./use-cost-data"

interface CostTrendChartProps {
  readonly data: readonly DailyCostEntry[]
  readonly isLoading: boolean
}

type TimeRange = "7d" | "30d" | "90d" | "all"

function filterByRange(data: readonly DailyCostEntry[], range: TimeRange): DailyCostEntry[] {
  if (range === "all") return [...data]

  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().split("T")[0]

  return data.filter((d) => d.date >= cutoffStr)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function CostTrendChart({ data, isLoading }: CostTrendChartProps) {
  const [range, setRange] = useState<TimeRange>("30d")

  const filtered = useMemo(() => filterByRange(data, range), [data, range])

  const rangeButtons: { readonly value: TimeRange; readonly label: string }[] = [
    { value: "7d", label: "7D" },
    { value: "30d", label: "30D" },
    { value: "90d", label: "90D" },
    { value: "all", label: "All" },
  ]

  return (
    <ChartContainer
      title="Cost Trends"
      subtitle="Daily spend with 7-day rolling average"
      isLoading={isLoading}
      isEmpty={filtered.length === 0}
      height="h-[320px]"
      actions={
        <div className="flex gap-1">
          {rangeButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setRange(btn.value)}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                range === btn.value
                  ? "bg-[#D4714E] text-[#F5F0EB]"
                  : "text-[#7A7267] hover:text-[#F5F0EB]"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={filtered} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
              <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 11, fill: CHART_AXIS_COLOR }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
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
              const labels: Record<string, string> = {
                cost: "Daily Cost",
                rollingAvg: "7-Day Avg",
                projected: "Projected",
              }
              return [`$${Number(value).toFixed(2)}`, labels[String(name)] ?? String(name)]
            }}
          />
          <Area
            type="monotone"
            dataKey="cost"
            fill="url(#costGradient)"
            stroke={CHART_COLORS.primary}
            strokeWidth={1.5}
          />
          <Line
            type="monotone"
            dataKey="rollingAvg"
            stroke={CHART_COLORS.quaternary}
            strokeWidth={2.5}
            dot={false}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="projected"
            stroke={CHART_COLORS.muted}
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
