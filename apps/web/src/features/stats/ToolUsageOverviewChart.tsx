import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface ToolUsageOverviewProps {
  toolFrequency?: Record<string, number>
  agentDispatches?: Record<string, number>
  planModeCount?: number
}

interface ToolEntry {
  readonly name: string
  readonly count: number
  readonly category: ToolCategory
}

type ToolCategory = 'file' | 'execution' | 'ai' | 'planning' | 'other'

const CATEGORY_COLORS: Record<ToolCategory, string> = {
  file: '#D97706',
  execution: '#10B981',
  ai: '#6366F1',
  planning: '#8B5CF6',
  other: '#737370',
}

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  file: 'File Ops',
  execution: 'Execution',
  ai: 'AI',
  planning: 'Planning',
  other: 'Other',
}

const FILE_OPS_TOOLS = new Set(['Read', 'Write', 'Edit', 'Glob', 'Grep'])
const EXECUTION_TOOLS = new Set(['Bash'])
const AI_TOOLS = new Set(['Agent', 'Skill', 'ToolSearch', 'SendMessage'])
const PLANNING_TOOLS = new Set([
  'EnterPlanMode',
  'ExitPlanMode',
  'TaskCreate',
  'TaskUpdate',
  'TaskGet',
  'TaskList',
  'TodoWrite',
])

function categorize(toolName: string): ToolCategory {
  if (FILE_OPS_TOOLS.has(toolName)) return 'file'
  if (EXECUTION_TOOLS.has(toolName)) return 'execution'
  if (AI_TOOLS.has(toolName)) return 'ai'
  if (PLANNING_TOOLS.has(toolName)) return 'planning'
  return 'other'
}

function computeTopTools(
  toolFrequency: Record<string, number>,
): readonly ToolEntry[] {
  return Object.entries(toolFrequency)
    .map(([name, count]) => ({
      name,
      count,
      category: categorize(name),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
}

function sumValues(record: Record<string, number> | undefined): number {
  if (!record) return 0
  return Object.values(record).reduce((sum, v) => sum + v, 0)
}

interface ToolTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: ToolEntry
    value: number
  }>
}

function ToolTooltip({ active, payload }: ToolTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const entry = payload[0].payload
  const color = CATEGORY_COLORS[entry.category]

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3 text-xs shadow-lg">
      <div className="flex items-center gap-2">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span style={{ color: 'var(--color-gray-300)' }}>
          {entry.name}
        </span>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-4">
        <span style={{ color: 'var(--color-gray-300)' }}>Invocations</span>
        <span className="font-mono font-medium" style={{ color: 'var(--color-gray-300)' }}>
          {entry.count.toLocaleString()}
        </span>
      </div>
      <div className="mt-1 text-gray-500">
        {CATEGORY_LABELS[entry.category]}
      </div>
    </div>
  )
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color }}>
        {value.toLocaleString()}
      </p>
    </div>
  )
}

function LegendItem({ category }: { category: ToolCategory }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: CATEGORY_COLORS[category] }}
      />
      <span className="text-xs text-gray-400">
        {CATEGORY_LABELS[category]}
      </span>
    </div>
  )
}

export function ToolUsageOverviewChart({
  toolFrequency,
  agentDispatches,
  planModeCount,
}: ToolUsageOverviewProps) {
  const topTools = useMemo(
    () => (toolFrequency ? computeTopTools(toolFrequency) : []),
    [toolFrequency],
  )

  const totalToolCalls = useMemo(
    () => sumValues(toolFrequency),
    [toolFrequency],
  )

  const totalAgentDispatches = useMemo(
    () => sumValues(agentDispatches),
    [agentDispatches],
  )

  const activeCategories = useMemo(() => {
    const seen = new Set<ToolCategory>()
    for (const tool of topTools) {
      seen.add(tool.category)
    }
    return Array.from(seen)
  }, [topTools])

  const isEmpty = topTools.length === 0

  if (isEmpty) {
    return (
      <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4">
        <h3 className="text-sm font-semibold text-gray-300">
          Tool Usage Overview
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          Aggregate tool calls across all sessions
        </p>
        <div className="mt-6 flex h-48 items-center justify-center">
          <p className="text-sm text-gray-500">No tool usage data available</p>
        </div>
      </div>
    )
  }

  const chartHeight = Math.max(200, topTools.length * 36 + 40)

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4">
      <h3 className="text-sm font-semibold text-gray-300">
        Tool Usage Overview
      </h3>
      <p className="mt-1 text-xs text-gray-500">
        Aggregate tool calls across all sessions
      </p>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatBox
          label="Total Tool Calls"
          value={totalToolCalls}
          color="#D97706"
        />
        <StatBox
          label="Agent Dispatches"
          value={totalAgentDispatches}
          color="#6366F1"
        />
        <StatBox
          label="Plan Mode Uses"
          value={planModeCount ?? 0}
          color="#8B5CF6"
        />
      </div>

      <div className="mt-4" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={topTools}
            layout="vertical"
            margin={{ left: 0, right: 40, top: 4, bottom: 4 }}
          >
            <XAxis
              type="number"
              tick={{ fill: 'var(--color-gray-500)', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => v.toLocaleString()}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: 'var(--color-gray-400)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={120}
            />
            <Tooltip
              content={<ToolTooltip />}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Bar
              dataKey="count"
              name="Invocations"
              radius={[0, 4, 4, 0]}
              barSize={20}
            >
              {topTools.map((tool) => (
                <Cell
                  key={tool.name}
                  fill={CATEGORY_COLORS[tool.category]}
                  opacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex flex-wrap gap-4">
        {activeCategories.map((category) => (
          <LegendItem key={category} category={category} />
        ))}
      </div>
    </div>
  )
}
