import { useMemo } from 'react'
import { startOfISOWeek, subWeeks, parseISO, isWithinInterval } from 'date-fns'
import type { DailyActivity } from '@/lib/parsers/types'

interface WeekTotals {
  messages: number
  sessions: number
  toolCalls: number
}

function sumWeek(
  data: DailyActivity[],
  weekStart: Date,
  weekEnd: Date,
): WeekTotals {
  const matching = data.filter((d) => {
    const date = parseISO(d.date)
    return isWithinInterval(date, { start: weekStart, end: weekEnd })
  })

  return {
    messages: matching.reduce((sum, d) => sum + d.messageCount, 0),
    sessions: matching.reduce((sum, d) => sum + d.sessionCount, 0),
    toolCalls: matching.reduce((sum, d) => sum + d.toolCallCount, 0),
  }
}

function computeChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

interface ComparisonMetric {
  label: string
  current: number
  previous: number
  change: number
}

function ChangeIndicator({ change }: { change: number }) {
  const isPositive = change > 0
  const isNeutral = change === 0
  const color = isNeutral
    ? 'text-gray-500'
    : isPositive
      ? 'text-emerald-400'
      : 'text-red-400'
  const arrow = isNeutral ? '' : isPositive ? '\u2191' : '\u2193'

  return (
    <span className={`text-xs font-medium ${color}`}>
      {arrow} {Math.abs(Math.round(change))}%
    </span>
  )
}

function MetricRow({ metric }: { metric: ComparisonMetric }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/40 p-3">
      <div>
        <p className="text-xs text-gray-400">{metric.label}</p>
        <p className="mt-1 text-xl font-bold text-gray-100">
          {metric.current.toLocaleString()}
        </p>
      </div>
      <div className="text-right">
        <ChangeIndicator change={metric.change} />
        <p className="mt-0.5 text-xs text-gray-500">
          vs {metric.previous.toLocaleString()}
        </p>
      </div>
    </div>
  )
}

export function WeeklyComparisonPanel({
  data,
}: {
  data: DailyActivity[]
}) {
  const metrics = useMemo((): ComparisonMetric[] => {
    const now = new Date()
    const thisWeekStart = startOfISOWeek(now)
    const lastWeekStart = subWeeks(thisWeekStart, 1)
    const lastWeekEnd = new Date(thisWeekStart.getTime() - 1)

    const thisWeek = sumWeek(data, thisWeekStart, now)
    const lastWeek = sumWeek(data, lastWeekStart, lastWeekEnd)

    return [
      {
        label: 'Messages',
        current: thisWeek.messages,
        previous: lastWeek.messages,
        change: computeChange(thisWeek.messages, lastWeek.messages),
      },
      {
        label: 'Sessions',
        current: thisWeek.sessions,
        previous: lastWeek.sessions,
        change: computeChange(thisWeek.sessions, lastWeek.sessions),
      },
      {
        label: 'Tool Calls',
        current: thisWeek.toolCalls,
        previous: lastWeek.toolCalls,
        change: computeChange(thisWeek.toolCalls, lastWeek.toolCalls),
      },
    ]
  }, [data])

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
      <h3 className="text-sm font-semibold text-gray-300">
        Weekly Comparison
      </h3>
      <p className="mt-1 text-xs text-gray-500">
        This week vs last week
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <MetricRow key={metric.label} metric={metric} />
        ))}
      </div>
    </div>
  )
}
