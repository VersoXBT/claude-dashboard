import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { parseISO, format, subDays, isAfter } from 'date-fns'
import type { DailyModelTokens } from '@/lib/parsers/types'

const COLORS = ['#D97706', '#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

interface PercentageEntry {
  readonly dateLabel: string
  readonly [model: string]: string | number
}

interface TrendsTooltipProps {
  active?: boolean
  payload?: ReadonlyArray<{
    name: string
    value: number
    color: string
  }>
  label?: string
}

function normalizeModelName(model: string): string {
  return model.replace(/^claude-/, '').split('-202')[0]
}

function getTopModels(
  data: ReadonlyArray<DailyModelTokens>,
  limit: number,
): { topModels: ReadonlyArray<string>; hasOther: boolean } {
  const totals: Record<string, number> = {}

  for (const day of data) {
    for (const [model, tokens] of Object.entries(day.tokensByModel)) {
      const normalized = normalizeModelName(model)
      totals[normalized] = (totals[normalized] ?? 0) + tokens
    }
  }

  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1])
  const topModels = sorted.slice(0, limit).map(([name]) => name)
  const hasOther = sorted.length > limit

  return { topModels, hasOther }
}

function buildPercentageData(
  data: ReadonlyArray<DailyModelTokens>,
  topModels: ReadonlyArray<string>,
  hasOther: boolean,
): ReadonlyArray<PercentageEntry> {
  return data.map((day) => {
    const modelTotals: Record<string, number> = {}
    let dayTotal = 0

    for (const [rawModel, tokens] of Object.entries(day.tokensByModel)) {
      const normalized = normalizeModelName(rawModel)
      if (topModels.includes(normalized)) {
        modelTotals[normalized] = (modelTotals[normalized] ?? 0) + tokens
      } else if (hasOther) {
        modelTotals['Other'] = (modelTotals['Other'] ?? 0) + tokens
      }
      dayTotal += tokens
    }

    const entry: Record<string, string | number> = {
      dateLabel: format(parseISO(day.date), 'MMM d'),
    }

    for (const model of topModels) {
      entry[model] =
        dayTotal > 0
          ? Math.round(((modelTotals[model] ?? 0) / dayTotal) * 100)
          : 0
    }

    if (hasOther) {
      entry['Other'] =
        dayTotal > 0
          ? Math.round(((modelTotals['Other'] ?? 0) / dayTotal) * 100)
          : 0
    }

    return entry as PercentageEntry
  })
}

function TrendsTooltip({ active, payload, label }: TrendsTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const visible = payload.filter((e) => e.value > 0).sort((a, b) => b.value - a.value)

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3 text-xs shadow-lg">
      <p className="mb-2 font-medium text-gray-300">{label}</p>
      {visible.map((entry) => (
        <div
          key={entry.name}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-400">{entry.name}</span>
          </div>
          <span className="font-mono text-gray-300">{entry.value}%</span>
        </div>
      ))}
    </div>
  )
}

export function ModelTrendsChart({
  data,
}: {
  data: DailyModelTokens[]
}) {
  const cutoff = useMemo(() => subDays(new Date(), 30), [])

  const recentData = useMemo(
    () =>
      data
        .filter((d) => isAfter(parseISO(d.date), cutoff))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [data, cutoff],
  )

  const { topModels, hasOther } = useMemo(
    () => getTopModels(recentData, 5),
    [recentData],
  )

  const allModelKeys = useMemo(() => {
    const keys = [...topModels]
    if (hasOther) keys.push('Other')
    return keys
  }, [topModels, hasOther])

  const chartData = useMemo(
    () => buildPercentageData(recentData, topModels, hasOther),
    [recentData, topModels, hasOther],
  )

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
        <h3 className="text-sm font-semibold text-gray-300">
          Model Mix Trends
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          How your model usage has shifted
        </p>
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-gray-500">No data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
      <h3 className="text-sm font-semibold text-gray-300">
        Model Mix Trends
      </h3>
      <p className="mt-1 text-xs text-gray-500">
        How your model usage has shifted
      </p>

      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} stackOffset="none">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-gray-800)"
            />
            <XAxis
              dataKey="dateLabel"
              tick={{ fill: 'var(--color-gray-500)', fontSize: 10 }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--color-gray-500)', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(value: number) => `${value}%`}
            />
            <Tooltip content={<TrendsTooltip />} />
            {allModelKeys.map((model, i) => (
              <Area
                key={model}
                type="monotone"
                dataKey={model}
                stackId="1"
                stroke={COLORS[i % COLORS.length]}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
