import { useMemo } from 'react'
import { parseISO, differenceInCalendarDays, format, subDays } from 'date-fns'
import type { DailyActivity } from '@/lib/parsers/types'

interface UsageStreakProps {
  data: DailyActivity[]
}

interface StreakStats {
  currentStreak: number
  longestStreak: number
  totalActiveDays: number
  last14Days: ReadonlyArray<{ date: string; active: boolean }>
}

function computeStreakStats(data: DailyActivity[]): StreakStats {
  if (data.length === 0) {
    const today = new Date()
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalActiveDays: 0,
      last14Days: Array.from({ length: 14 }, (_, i) => ({
        date: format(subDays(today, 13 - i), 'yyyy-MM-dd'),
        active: false,
      })),
    }
  }

  const activeDatesSet = new Set(
    data
      .filter((d) => d.messageCount > 0 || d.sessionCount > 0)
      .map((d) => d.date),
  )

  const totalActiveDays = activeDatesSet.size

  // Sort dates chronologically for streak computation
  const sortedDates = [...activeDatesSet].sort()

  // Compute longest streak
  let longestStreak = 0
  let tempStreak = 0
  let previousDate: Date | null = null

  for (const dateStr of sortedDates) {
    const current = parseISO(dateStr)
    if (previousDate !== null && differenceInCalendarDays(current, previousDate) === 1) {
      tempStreak += 1
    } else {
      tempStreak = 1
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak
    }
    previousDate = current
  }

  // Compute current streak (ending today or yesterday)
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd')

  let currentStreak = 0
  if (activeDatesSet.has(todayStr) || activeDatesSet.has(yesterdayStr)) {
    const startDate = activeDatesSet.has(todayStr) ? today : subDays(today, 1)
    let checkDate = startDate
    while (activeDatesSet.has(format(checkDate, 'yyyy-MM-dd'))) {
      currentStreak += 1
      checkDate = subDays(checkDate, 1)
    }
  }

  // Build last 14 days
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const date = format(subDays(today, 13 - i), 'yyyy-MM-dd')
    return { date, active: activeDatesSet.has(date) }
  })

  return { currentStreak, longestStreak, totalActiveDays, last14Days }
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
      <p className={`mt-1 text-2xl font-bold tabular-nums ${color}`}>
        {value.toLocaleString()}
      </p>
    </div>
  )
}

export function UsageStreakPanel({ data }: UsageStreakProps) {
  const stats = useMemo(() => computeStreakStats(data), [data])

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
      <h3 className="text-sm font-semibold text-gray-300">Usage Streaks</h3>
      <p className="mt-1 text-xs text-gray-500">
        Consecutive days of Claude usage
      </p>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatBox
          label="Current Streak"
          value={stats.currentStreak}
          color={stats.currentStreak > 0 ? 'text-emerald-400' : 'text-gray-400'}
        />
        <StatBox
          label="Longest Streak"
          value={stats.longestStreak}
          color="text-gray-100"
        />
        <StatBox
          label="Active Days"
          value={stats.totalActiveDays}
          color="text-gray-100"
        />
      </div>

      <div className="mt-4">
        <p className="text-xs text-gray-400">Last 14 days</p>
        <div className="mt-2 flex items-center gap-1.5">
          {stats.last14Days.map((day) => (
            <div
              key={day.date}
              title={`${format(parseISO(day.date), 'MMM d')}${day.active ? ' (active)' : ''}`}
              className={`h-4 w-4 rounded-full border-2 transition-colors ${
                day.active
                  ? 'border-emerald-500 bg-emerald-500'
                  : 'border-gray-600 bg-transparent'
              }`}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-gray-400">Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full border border-gray-600 bg-transparent" />
            <span className="text-gray-400">Inactive</span>
          </div>
        </div>
      </div>
    </div>
  )
}
