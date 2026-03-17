import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts'
import type { ModelUsage } from '@/lib/parsers/types'
import { formatTokenCount } from '@/lib/utils/format'

interface TokenEfficiencyProps {
  modelUsage: ModelUsage
}

interface EfficiencyStats {
  outputInputRatio: number
  cacheUtilizationRate: number
  modelBreakdown: ReadonlyArray<{
    name: string
    inputTokens: number
    outputTokens: number
  }>
}

const CHART_COLORS = {
  input: '#6366F1',
  output: '#D97706',
} as const

function computeEfficiencyStats(modelUsage: ModelUsage): EfficiencyStats {
  let totalInput = 0
  let totalOutput = 0
  let totalCacheRead = 0
  let totalAllInput = 0

  const entries = Object.entries(modelUsage).map(([model, usage]) => {
    const input = usage.inputTokens
    const output = usage.outputTokens
    const cacheRead = usage.cacheReadInputTokens

    totalInput += input
    totalOutput += output
    totalCacheRead += cacheRead
    totalAllInput += input + cacheRead + usage.cacheCreationInputTokens

    return {
      name: model.replace(/^claude-/, '').split('-202')[0],
      inputTokens: input,
      outputTokens: output,
      total: input + output,
    }
  })

  const outputInputRatio = totalInput > 0 ? totalOutput / totalInput : 0
  const cacheUtilizationRate = totalAllInput > 0 ? totalCacheRead / totalAllInput : 0

  // Sort by total tokens descending, take top 5
  const sorted = [...entries].sort((a, b) => b.total - a.total)
  const modelBreakdown = sorted.slice(0, 5).map(({ name, inputTokens, outputTokens }) => ({
    name,
    inputTokens,
    outputTokens,
  }))

  return { outputInputRatio, cacheUtilizationRate, modelBreakdown }
}

function StatBox({
  label,
  value,
  suffix,
}: {
  label: string
  value: string
  suffix?: string
}) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-gray-100">
        {value}
        {suffix && <span className="ml-0.5 text-sm text-gray-500">{suffix}</span>}
      </p>
    </div>
  )
}

export function TokenEfficiencyPanel({ modelUsage }: TokenEfficiencyProps) {
  const stats = useMemo(() => computeEfficiencyStats(modelUsage), [modelUsage])

  const hasData = stats.modelBreakdown.length > 0

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
      <h3 className="text-sm font-semibold text-gray-300">Token Efficiency</h3>
      <p className="mt-1 text-xs text-gray-500">
        Output efficiency and cache utilization
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatBox
          label="Output / Input Ratio"
          value={stats.outputInputRatio.toFixed(2)}
          suffix="x"
        />
        <StatBox
          label="Cache Utilization"
          value={`${Math.round(stats.cacheUtilizationRate * 100)}`}
          suffix="%"
        />
      </div>

      {hasData ? (
        <div className="mt-4">
          <p className="text-xs text-gray-400">
            Input vs Output by Model (Top 5)
          </p>
          <div className="mt-2 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.modelBreakdown}
                layout="vertical"
                margin={{ left: 0, right: 12, top: 4, bottom: 4 }}
              >
                <XAxis
                  type="number"
                  tick={{ fill: 'var(--color-gray-500)', fontSize: 10 }}
                  tickFormatter={(v) => formatTokenCount(v)}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: 'var(--color-gray-400)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={100}
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
                  formatter={(value) => formatTokenCount(value as number)}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', color: 'var(--color-gray-400)' }}
                />
                <Bar
                  dataKey="inputTokens"
                  name="Input"
                  radius={[0, 2, 2, 0]}
                >
                  {stats.modelBreakdown.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS.input} opacity={0.8} />
                  ))}
                </Bar>
                <Bar
                  dataKey="outputTokens"
                  name="Output"
                  radius={[0, 2, 2, 0]}
                >
                  {stats.modelBreakdown.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS.output} opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex h-32 items-center justify-center">
          <p className="text-sm text-gray-500">No model usage data available</p>
        </div>
      )}
    </div>
  )
}
