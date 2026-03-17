import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import type { DailyActivity } from '@/lib/parsers/types'

interface Bucket {
  label: string
  min: number
  max: number
}

const BUCKETS: Bucket[] = [
  { label: '1-10', min: 1, max: 10 },
  { label: '11-50', min: 11, max: 50 },
  { label: '51-100', min: 51, max: 100 },
  { label: '101-500', min: 101, max: 500 },
  { label: '500+', min: 501, max: Infinity },
]

interface ChartEntry {
  label: string
  sessions: number
  messages: number
  toolCalls: number
}

function bucketDailyActivity(data: DailyActivity[]): ChartEntry[] {
  return BUCKETS.map((bucket) => {
    const matching = data.filter(
      (d) => d.messageCount >= bucket.min && d.messageCount <= bucket.max,
    )
    return {
      label: bucket.label,
      sessions: matching.reduce((sum, d) => sum + d.sessionCount, 0),
      messages: matching.reduce((sum, d) => sum + d.messageCount, 0),
      toolCalls: matching.reduce((sum, d) => sum + d.toolCallCount, 0),
    }
  })
}

interface ComplexityTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
  }>
  label?: string
}

function ComplexityTooltip({ active, payload, label }: ComplexityTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3 text-xs shadow-lg">
      <p className="mb-2 font-medium text-gray-300">{label} messages/day</p>
      {payload.map((entry) => (
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
          <span className="font-mono text-gray-300">
            {entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

export function SessionComplexityChart({
  data,
}: {
  data: DailyActivity[]
}) {
  const chartData = useMemo(() => bucketDailyActivity(data), [data])

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4">
        <h3 className="text-sm font-semibold text-gray-300">
          Session Complexity
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          Distribution of daily activity by message volume
        </p>
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-gray-500">No data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4">
      <h3 className="text-sm font-semibold text-gray-300">
        Session Complexity
      </h3>
      <p className="mt-1 text-xs text-gray-500">
        Distribution of daily activity by message volume
      </p>

      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-gray-800)"
            />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--color-gray-500)', fontSize: 10 }}
              tickLine={false}
              label={{
                value: 'Messages per day',
                position: 'insideBottom',
                offset: -2,
                fill: 'var(--color-gray-500)',
                fontSize: 10,
              }}
            />
            <YAxis
              tick={{ fill: 'var(--color-gray-500)', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<ComplexityTooltip />} />
            <Bar
              dataKey="sessions"
              name="Sessions"
              fill="#D97706"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="toolCalls"
              name="Tool Calls"
              fill="#6366F1"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
