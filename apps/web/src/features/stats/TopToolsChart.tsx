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

interface TopToolsChartProps {
  toolCounts: Record<string, number>
}

interface ToolEntry {
  readonly name: string
  readonly count: number
}

const BAR_COLOR = '#D97706'

function computeTopTools(toolCounts: Record<string, number>): readonly ToolEntry[] {
  return Object.entries(toolCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

export function TopToolsChart({ toolCounts }: TopToolsChartProps) {
  const topTools = useMemo(() => computeTopTools(toolCounts), [toolCounts])

  if (topTools.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
        <h3 className="text-sm font-semibold text-gray-300">Top Tools</h3>
        <p className="mt-1 text-xs text-gray-500">
          Most frequently used tools
        </p>
        <div className="mt-6 flex h-48 items-center justify-center">
          <p className="text-sm text-gray-500">No tool usage data available</p>
        </div>
      </div>
    )
  }

  const chartHeight = Math.max(200, topTools.length * 36 + 40)

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
      <h3 className="text-sm font-semibold text-gray-300">Top Tools</h3>
      <p className="mt-1 text-xs text-gray-500">
        Most frequently used tools (top {topTools.length})
      </p>

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
              tickFormatter={(v) => v.toLocaleString()}
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
              contentStyle={{
                backgroundColor: 'var(--color-gray-900)',
                border: '1px solid var(--color-gray-700)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--color-gray-300)',
              }}
              labelStyle={{ color: 'var(--color-gray-300)' }}
              itemStyle={{ color: 'var(--color-gray-400)' }}
              formatter={(value) => [
                (value as number).toLocaleString(),
                'Invocations',
              ]}
            />
            <Bar
              dataKey="count"
              name="Invocations"
              radius={[0, 4, 4, 0]}
              barSize={20}
            >
              {topTools.map((_, i) => (
                <Cell
                  key={i}
                  fill={BAR_COLOR}
                  opacity={0.9 - i * 0.05}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
