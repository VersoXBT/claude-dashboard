import { useState, useMemo } from 'react'
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { format, parseISO, startOfISOWeek } from 'date-fns'
import type { DailyModelTokens, ModelUsage } from '@/lib/parsers/types'
import type { CostBreakdown } from '@/features/cost-estimation/cost-estimation.types'
import { formatUSD } from '@/lib/utils/format'

const COLORS = ['#d97757', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#b07cc5']

type Granularity = 'daily' | 'weekly'

function normalizeModelName(model: string): string {
  return model.replace(/^claude-/, '').split('-202')[0]
}

/**
 * Compute effective cost-per-token for each model using global usage data
 * and the calculated cost breakdown. This lets us estimate daily cost from
 * the daily total-token counts.
 */
function buildCostPerToken(
  modelUsage: ModelUsage,
  costBreakdown: CostBreakdown,
): Record<string, number> {
  const result: Record<string, number> = {}

  for (const [rawModel, usage] of Object.entries(modelUsage)) {
    const normalized = normalizeModelName(rawModel)
    const totalTokens = usage.inputTokens + usage.outputTokens +
      usage.cacheReadInputTokens + usage.cacheCreationInputTokens

    if (totalTokens === 0) continue

    // Find the matching cost entry (costBreakdown keys are normalized via normalizeModelId)
    const modelCost = Object.values(costBreakdown.byModel).find(
      (m) => normalizeModelName(m.modelId) === normalized,
    )

    if (modelCost) {
      // dailyModelTokens uses input+output only, so scale accordingly
      const dailyRelevantTokens = usage.inputTokens + usage.outputTokens
      if (dailyRelevantTokens > 0) {
        result[normalized] = (result[normalized] ?? 0) + modelCost.totalCost
        // We'll compute ratio below
      }
    }
  }

  // Now convert total cost to cost-per-token
  const tokenTotals: Record<string, number> = {}
  for (const [rawModel, usage] of Object.entries(modelUsage)) {
    const normalized = normalizeModelName(rawModel)
    const dailyRelevantTokens = usage.inputTokens + usage.outputTokens
    tokenTotals[normalized] = (tokenTotals[normalized] ?? 0) + dailyRelevantTokens
  }

  for (const model of Object.keys(result)) {
    if (tokenTotals[model] && tokenTotals[model] > 0) {
      result[model] = result[model] / tokenTotals[model]
    }
  }

  return result
}

function getTopModels(
  data: DailyModelTokens[],
  limit: number,
): { topModels: string[]; hasOther: boolean } {
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

interface ProcessedEntry {
  dateLabel: string
  sortKey: string
  total: number
  [model: string]: string | number
}

function processDaily(
  data: DailyModelTokens[],
  topModels: string[],
  hasOther: boolean,
  costPerToken: Record<string, number>,
): ProcessedEntry[] {
  return data.map((day) => {
    const entry: ProcessedEntry = {
      dateLabel: format(parseISO(day.date), 'MMM d'),
      sortKey: day.date,
      total: 0,
    }

    for (const model of topModels) {
      entry[model] = 0
    }
    if (hasOther) {
      entry['Other'] = 0
    }

    for (const [rawModel, tokens] of Object.entries(day.tokensByModel)) {
      const normalized = normalizeModelName(rawModel)
      const rate = costPerToken[normalized] ?? 0
      const cost = tokens * rate

      if (topModels.includes(normalized)) {
        entry[normalized] = (entry[normalized] as number) + cost
      } else if (hasOther) {
        entry['Other'] = (entry['Other'] as number) + cost
      }
      entry.total += cost
    }

    return entry
  })
}

function processWeekly(
  data: DailyModelTokens[],
  topModels: string[],
  hasOther: boolean,
  costPerToken: Record<string, number>,
): ProcessedEntry[] {
  const weekMap = new Map<string, ProcessedEntry>()

  for (const day of data) {
    const weekStart = startOfISOWeek(parseISO(day.date))
    const weekKey = format(weekStart, 'yyyy-MM-dd')

    if (!weekMap.has(weekKey)) {
      const entry: ProcessedEntry = {
        dateLabel: `Week of ${format(weekStart, 'MMM d')}`,
        sortKey: weekKey,
        total: 0,
      }
      for (const model of topModels) {
        entry[model] = 0
      }
      if (hasOther) {
        entry['Other'] = 0
      }
      weekMap.set(weekKey, entry)
    }

    const entry = weekMap.get(weekKey)!
    for (const [rawModel, tokens] of Object.entries(day.tokensByModel)) {
      const normalized = normalizeModelName(rawModel)
      const rate = costPerToken[normalized] ?? 0
      const cost = tokens * rate

      if (topModels.includes(normalized)) {
        entry[normalized] = (entry[normalized] as number) + cost
      } else if (hasOther) {
        entry['Other'] = (entry['Other'] as number) + cost
      }
      entry.total += cost
    }
  }

  return Array.from(weekMap.values()).sort((a, b) =>
    a.sortKey.localeCompare(b.sortKey),
  )
}

interface CostTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
    dataKey: string
  }>
  label?: string
}

function CostTooltip({ active, payload, label }: CostTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const areas = payload.filter((e) => e.dataKey !== 'total' && e.value > 0)
  const totalEntry = payload.find((e) => e.dataKey === 'total')

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3 text-xs shadow-lg">
      <p className="mb-2 font-medium text-gray-300">{label}</p>
      {areas
        .sort((a, b) => b.value - a.value)
        .map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-400">{entry.name}</span>
            </div>
            <span className="font-mono text-gray-300">
              {formatUSD(entry.value)}
            </span>
          </div>
        ))}
      {totalEntry && (
        <div className="mt-1.5 border-t border-gray-700 pt-1.5 flex justify-between">
          <span className="text-gray-400">Total</span>
          <span className="font-mono font-medium text-gray-100">
            {formatUSD(totalEntry.value)}
          </span>
        </div>
      )}
    </div>
  )
}

export function CostTrendChart({
  data,
  modelUsage,
  costBreakdown,
}: {
  data: DailyModelTokens[]
  modelUsage: ModelUsage
  costBreakdown: CostBreakdown
}) {
  const [granularity, setGranularity] = useState<Granularity>('daily')

  const costPerToken = useMemo(
    () => buildCostPerToken(modelUsage, costBreakdown),
    [modelUsage, costBreakdown],
  )

  const { topModels, hasOther } = useMemo(
    () => getTopModels(data, 5),
    [data],
  )

  const allModelKeys = useMemo(() => {
    const keys = [...topModels]
    if (hasOther) keys.push('Other')
    return keys
  }, [topModels, hasOther])

  const chartData = useMemo(() => {
    if (granularity === 'weekly') {
      return processWeekly(data, topModels, hasOther, costPerToken)
    }
    return processDaily(data, topModels, hasOther, costPerToken)
  }, [data, topModels, hasOther, granularity, costPerToken])

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
        <h3 className="text-sm font-semibold text-gray-300">
          Cost Trend
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          Estimated daily cost by model
        </p>
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-gray-500">No data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-300">
            Cost Trend
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Estimated daily cost by model
          </p>
        </div>
        <div className="flex rounded-lg border border-gray-700 text-xs">
          <button
            type="button"
            onClick={() => setGranularity('daily')}
            className={`rounded-l-lg px-3 py-1 ${
              granularity === 'daily'
                ? 'bg-gray-700 text-gray-100'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Daily
          </button>
          <button
            type="button"
            onClick={() => setGranularity('weekly')}
            className={`rounded-r-lg px-3 py-1 ${
              granularity === 'weekly'
                ? 'bg-gray-700 text-gray-100'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Weekly
          </button>
        </div>
      </div>

      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-800)" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fill: 'var(--color-gray-500)', fontSize: 10 }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--color-gray-500)', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => formatUSD(value)}
            />
            <Tooltip content={<CostTooltip />} />
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
            <Line
              type="monotone"
              dataKey="total"
              name="Total"
              stroke="var(--color-gray-300)"
              strokeWidth={2}
              strokeDasharray="4 2"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
