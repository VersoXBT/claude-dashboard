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
import type { HistoryEntry } from "@/lib/types"

interface ToolFrequencyChartProps {
  readonly entries: readonly HistoryEntry[]
  readonly isLoading?: boolean
}

interface ToolDataPoint {
  readonly name: string
  readonly count: number
}

const TOOL_PATTERN = /(?:tool_use|tool_call|invoke)\s*[:\-]?\s*(\w+)/gi
const KNOWN_TOOLS = [
  "Read",
  "Write",
  "Edit",
  "Bash",
  "Grep",
  "Glob",
  "WebSearch",
  "WebFetch",
  "TodoWrite",
  "Agent",
  "NotebookEdit",
  "SendMessage",
  "TaskCreate",
  "TaskUpdate",
  "TaskList",
  "TaskGet",
] as const

function parseToolCalls(entries: readonly HistoryEntry[]): readonly ToolDataPoint[] {
  const toolCounts = new Map<string, number>()

  for (const entry of entries) {
    const text = entry.display ?? ""

    for (const tool of KNOWN_TOOLS) {
      const regex = new RegExp(`\\b${tool}\\b`, "gi")
      const matches = text.match(regex)
      if (matches) {
        toolCounts.set(tool, (toolCounts.get(tool) ?? 0) + matches.length)
      }
    }

    const patternMatches = text.matchAll(TOOL_PATTERN)
    for (const match of patternMatches) {
      const toolName = match[1]
      if (toolName && !KNOWN_TOOLS.some((t) => t.toLowerCase() === toolName.toLowerCase())) {
        toolCounts.set(toolName, (toolCounts.get(toolName) ?? 0) + 1)
      }
    }
  }

  return [...toolCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
}

function CustomTooltip({
  active,
  payload,
}: {
  readonly active?: boolean
  readonly payload?: readonly { readonly value: number; readonly payload: ToolDataPoint }[]
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-[#2D2822] border border-[#3D3830] rounded-md px-3 py-2 text-xs shadow-lg">
      <div className="font-medium text-[#F5F0EB] mb-1">
        {payload[0].payload.name}
      </div>
      <div className="text-[#B8AFA5]">{payload[0].value} invocations</div>
    </div>
  )
}

export function ToolFrequencyChart({
  entries,
  isLoading = false,
}: ToolFrequencyChartProps) {
  const data = parseToolCalls(entries)

  return (
    <ChartContainer
      title="Tool Call Frequency"
      subtitle="Top tools by invocation count"
      isLoading={isLoading}
      isEmpty={data.length === 0}
      height="h-[400px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#302C26" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: "#7A7267", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "#B8AFA5", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={90}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="count"
            fill={CHART_COLORS.secondary}
            radius={[0, 3, 3, 0]}
            opacity={0.8}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
