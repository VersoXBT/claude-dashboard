import { useMemo } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { parseISO, format, subDays, isAfter } from 'date-fns'
import type { DailyActivity } from '@/lib/parsers/types'

interface VelocityEntry {
  readonly dateLabel: string
  readonly messageCount: number
  readonly movingAverage: number | null
}

interface VelocityTooltipProps {
  active?: boolean
  payload?: ReadonlyArray<{
    name: string
    value: number
    color: string
  }>
  label?: string
}

function computeMovingAverage(
  data: ReadonlyArray<{ messageCount: number }>,
  index: number,
  window: number,
): number | null {
  if (index < window - 1) return null

  let sum = 0
  for (let i = index - window + 1; i <= index; i++) {
    sum += data[i].messageCount
  }
  return sum / window
}

function VelocityTooltip({ active, payload, label }: VelocityTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3 text-xs shadow-lg">
      <p className="mb-2 font-medium text-gray-300">{label}</p>
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
            {Math.round(entry.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

export function CodingVelocityChart({
  data,
}: {
  data: DailyActivity[]
}) {
  const chartData = useMemo((): ReadonlyArray<VelocityEntry> => {
    const cutoff = subDays(new Date(), 30)

    const recent = data
      .filter((d) => isAfter(parseISO(d.date), cutoff))
      .sort((a, b) => a.date.localeCompare(b.date))

    return recent.map((d, i) => ({
      dateLabel: format(parseISO(d.date), 'MMM d'),
      messageCount: d.messageCount,
      movingAverage: computeMovingAverage(recent, i, 7),
    }))
  }, [data])

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
        <h3 className="text-sm font-semibold text-gray-300">
          Coding Velocity
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          Messages per day with 7-day moving average
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
        Coding Velocity
      </h3>
      <p className="mt-1 text-xs text-gray-500">
        Messages per day with 7-day moving average
      </p>

      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
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
            />
            <Tooltip content={<VelocityTooltip />} />
            <Bar
              dataKey="messageCount"
              name="Messages"
              fill="#D97706"
              fillOpacity={0.4}
              radius={[2, 2, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="movingAverage"
              name="7-day Average"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
