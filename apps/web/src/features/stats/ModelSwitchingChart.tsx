import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts'
import type { ModelUsage } from '@/lib/parsers/types'
import { formatTokenCount } from '@/lib/utils/format'

const COLORS = ['#d97757', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#b07cc5']

function normalizeModelName(model: string): string {
  return model.replace(/^claude-/, '').split('-202')[0]
}

interface ChartEntry {
  name: string
  totalTokens: number
  inputTokens: number
  outputTokens: number
}

export function ModelSwitchingChart({ data }: { data: ModelUsage }) {
  const chartData = useMemo(() => {
    const merged = new Map<string, ChartEntry>()

    for (const [model, usage] of Object.entries(data)) {
      const name = normalizeModelName(model)
      const existing = merged.get(name)
      if (existing) {
        merged.set(name, {
          ...existing,
          totalTokens: existing.totalTokens + usage.inputTokens + usage.outputTokens,
          inputTokens: existing.inputTokens + usage.inputTokens,
          outputTokens: existing.outputTokens + usage.outputTokens,
        })
      } else {
        merged.set(name, {
          name,
          totalTokens: usage.inputTokens + usage.outputTokens,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
        })
      }
    }

    return Array.from(merged.values()).sort((a, b) => b.totalTokens - a.totalTokens)
  }, [data])

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
        <h3 className="text-sm font-semibold text-gray-300">Model Breakdown</h3>
        <p className="mt-1 text-xs text-gray-500">Total tokens per model</p>
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-gray-500">No data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
      <h3 className="text-sm font-semibold text-gray-300">Model Breakdown</h3>
      <p className="mt-1 text-xs text-gray-500">
        Total tokens consumed per model
      </p>

      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-800)" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: 'var(--color-gray-500)', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => formatTokenCount(value)}
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
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null
                const entry = payload[0].payload as ChartEntry
                return (
                  <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs shadow-xl shadow-black/40">
                    <p className="font-medium text-gray-300">{entry.name}</p>
                    <div className="mt-1 space-y-0.5 text-gray-400">
                      <p>Input: {formatTokenCount(entry.inputTokens)}</p>
                      <p>Output: {formatTokenCount(entry.outputTokens)}</p>
                      <p className="border-t border-gray-700 pt-1 font-medium text-gray-300">
                        Total: {formatTokenCount(entry.totalTokens)}
                      </p>
                    </div>
                  </div>
                )
              }}
            />
            <Bar dataKey="totalTokens" radius={[0, 4, 4, 0]} maxBarSize={28}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
