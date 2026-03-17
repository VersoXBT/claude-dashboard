import { useMemo } from 'react'
import { parseISO, format } from 'date-fns'
import type { DailyActivity } from '@/lib/parsers/types'

interface AverageSessionPanelProps {
  data: DailyActivity[]
  totalSessions: number
  totalMessages: number
  longestSession: {
    duration: number
    messageCount: number
  }
}

interface SessionMetric {
  readonly label: string
  readonly value: string
  readonly suffix?: string
  readonly description: string
}

function computeSessionMetrics(
  data: DailyActivity[],
  totalSessions: number,
  totalMessages: number,
): ReadonlyArray<SessionMetric> {
  const activeDays = data.filter(
    (d) => d.messageCount > 0 || d.sessionCount > 0,
  ).length

  const totalToolCalls = data.reduce((sum, d) => sum + d.toolCallCount, 0)

  const avgMessagesPerSession =
    totalSessions > 0 ? totalMessages / totalSessions : 0

  const avgSessionsPerDay = activeDays > 0 ? totalSessions / activeDays : 0

  const avgToolCallsPerSession =
    totalSessions > 0 ? totalToolCalls / totalSessions : 0

  const peakDay = data.reduce<DailyActivity | null>((best, d) => {
    if (best === null || d.messageCount > best.messageCount) return d
    return best
  }, null)

  const peakDayLabel = peakDay
    ? format(parseISO(peakDay.date), 'MMM d')
    : 'N/A'

  return [
    {
      label: 'Avg Messages/Session',
      value: avgMessagesPerSession.toFixed(1),
      description: 'Messages exchanged per session',
    },
    {
      label: 'Avg Sessions/Day',
      value: avgSessionsPerDay.toFixed(1),
      description: 'Sessions started per active day',
    },
    {
      label: 'Avg Tool Calls/Session',
      value: avgToolCallsPerSession.toFixed(1),
      description: 'Tool invocations per session',
    },
    {
      label: 'Peak Day',
      value: peakDayLabel,
      suffix: peakDay ? `${peakDay.messageCount.toLocaleString()} msgs` : '',
      description: 'Day with the most messages',
    },
  ]
}

function MetricCard({ metric }: { metric: SessionMetric }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
      <p className="text-xs text-gray-400">{metric.label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-gray-100">
        {metric.value}
        {metric.suffix && (
          <span className="ml-1 text-sm font-normal text-gray-500">
            {metric.suffix}
          </span>
        )}
      </p>
      <p className="mt-0.5 text-xs text-gray-500">{metric.description}</p>
    </div>
  )
}

export function AverageSessionPanel({
  data,
  totalSessions,
  totalMessages,
}: AverageSessionPanelProps) {
  const metrics = useMemo(
    () => computeSessionMetrics(data, totalSessions, totalMessages),
    [data, totalSessions, totalMessages],
  )

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
      <h3 className="text-sm font-semibold text-gray-300">
        Session Averages
      </h3>
      <p className="mt-1 text-xs text-gray-500">
        Average metrics across all sessions
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>
    </div>
  )
}
