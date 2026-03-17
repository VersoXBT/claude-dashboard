"use client"

import { useMemo, useState } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { ChartContainer } from "@/components/charts/chart-container"
import { TOKEN_COLORS } from "@/components/charts/recharts-theme"
import type { ModelUsage } from "@/lib/types"

interface TokenUsageChartProps {
  readonly modelUsage: Readonly<Record<string, ModelUsage>>
  readonly dailyActivity: readonly { date: string; messageCount: number }[]
}

type TimeRange = "7d" | "30d" | "90d" | "all"

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function TokenUsageChart({
  modelUsage,
  dailyActivity,
}: TokenUsageChartProps) {
  const [range, setRange] = useState<TimeRange>("30d")

  const chartData = useMemo(() => {
    const totalUsage = Object.values(modelUsage).reduce(
      (acc, m) => ({
        input: acc.input + m.inputTokens,
        output: acc.output + m.outputTokens,
        cacheRead: acc.cacheRead + m.cacheReadInputTokens,
        cacheCreation: acc.cacheCreation + m.cacheCreationInputTokens,
      }),
      { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 }
    )

    const totalTokens =
      totalUsage.input +
      totalUsage.output +
      totalUsage.cacheRead +
      totalUsage.cacheCreation
    const totalMessages = dailyActivity.reduce(
      (sum, d) => sum + d.messageCount,
      0
    )

    const sorted = [...dailyActivity].sort((a, b) =>
      a.date.localeCompare(b.date)
    )

    const now = new Date()
    const cutoff =
      range === "7d"
        ? new Date(now.getTime() - 7 * 86400000)
        : range === "30d"
          ? new Date(now.getTime() - 30 * 86400000)
          : range === "90d"
            ? new Date(now.getTime() - 90 * 86400000)
            : null

    const filtered = cutoff
      ? sorted.filter((d) => new Date(d.date) >= cutoff)
      : sorted

    return filtered.map((d) => {
      const ratio =
        totalMessages > 0 ? d.messageCount / totalMessages : 0
      return {
        date: d.date,
        input: Math.round(totalUsage.input * ratio),
        output: Math.round(totalUsage.output * ratio),
        cacheRead: Math.round(totalUsage.cacheRead * ratio),
        cacheCreation: Math.round(totalUsage.cacheCreation * ratio),
      }
    })
  }, [modelUsage, dailyActivity, range])

  const ranges: { value: TimeRange; label: string }[] = [
    { value: "7d", label: "7d" },
    { value: "30d", label: "30d" },
    { value: "90d", label: "90d" },
    { value: "all", label: "All" },
  ]

  return (
    <ChartContainer
      title="Token Usage Over Time"
      subtitle="Daily token consumption by type"
      height="h-[350px]"
      isEmpty={chartData.length === 0}
      actions={
        <div className="flex items-center gap-0.5 bg-zinc-800 rounded-md p-0.5">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                range === r.value
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="gradInput" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={TOKEN_COLORS.input} stopOpacity={0.3} />
              <stop offset="95%" stopColor={TOKEN_COLORS.input} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradOutput" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={TOKEN_COLORS.output} stopOpacity={0.3} />
              <stop offset="95%" stopColor={TOKEN_COLORS.output} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradCacheRead" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={TOKEN_COLORS.cacheRead} stopOpacity={0.3} />
              <stop offset="95%" stopColor={TOKEN_COLORS.cacheRead} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradCacheCreation" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={TOKEN_COLORS.cacheCreation} stopOpacity={0.3} />
              <stop offset="95%" stopColor={TOKEN_COLORS.cacheCreation} stopOpacity={0} />
            </linearGradient>
          </defs>
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
            tickFormatter={formatTokens}
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
            formatter={(value) => [formatTokens(Number(value)), undefined]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "11px", color: "#a1a1aa" }}
          />
          <Area
            type="monotone"
            dataKey="cacheRead"
            stackId="1"
            name="Cache Read"
            stroke={TOKEN_COLORS.cacheRead}
            fill="url(#gradCacheRead)"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="cacheCreation"
            stackId="1"
            name="Cache Write"
            stroke={TOKEN_COLORS.cacheCreation}
            fill="url(#gradCacheCreation)"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="input"
            stackId="1"
            name="Input"
            stroke={TOKEN_COLORS.input}
            fill="url(#gradInput)"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="output"
            stackId="1"
            name="Output"
            stroke={TOKEN_COLORS.output}
            fill="url(#gradOutput)"
            strokeWidth={1.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
