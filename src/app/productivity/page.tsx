"use client"

import { useStats, useHistory } from "@/hooks/use-dashboard-data"
import { StatCard } from "@/components/data-display/stat-card"
import { ActivityHeatmap } from "@/features/productivity/activity-heatmap"
import { SessionDurationChart } from "@/features/productivity/session-duration-chart"
import { PeakHoursChart } from "@/features/productivity/peak-hours-chart"
import { ToolFrequencyChart } from "@/features/productivity/tool-frequency-chart"
import { Skeleton } from "@/components/ui/skeleton"
import { Flame, MessageSquare, Clock, Wrench } from "lucide-react"

function calculateStreak(
  dailyActivity: readonly { date: string; messageCount: number }[]
): number {
  if (dailyActivity.length === 0) return 0

  const sorted = [...dailyActivity]
    .filter((d) => d.messageCount > 0)
    .sort((a, b) => b.date.localeCompare(a.date))

  let streak = 0
  const today = new Date()

  for (let i = 0; i < sorted.length; i++) {
    const expected = new Date(today)
    expected.setDate(expected.getDate() - i)
    const expectedStr = expected.toISOString().split("T")[0]

    if (sorted.some((d) => d.date === expectedStr)) {
      streak++
    } else {
      break
    }
  }

  return streak
}

function getMessagesThisWeek(
  dailyActivity: readonly { date: string; messageCount: number }[]
): number {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const monday = new Date(now)
  monday.setDate(monday.getDate() - mondayOffset)
  const mondayStr = monday.toISOString().split("T")[0]

  return dailyActivity
    .filter((d) => d.date >= mondayStr)
    .reduce((sum, d) => sum + d.messageCount, 0)
}

function getAvgSessionDuration(
  dailyActivity: readonly {
    date: string
    messageCount: number
    sessionCount: number
  }[]
): string {
  const recent = dailyActivity.slice(-30)
  const totalSessions = recent.reduce((sum, d) => sum + d.sessionCount, 0)
  const totalMessages = recent.reduce((sum, d) => sum + d.messageCount, 0)

  if (totalSessions === 0) return "0m"

  const avgMessages = totalMessages / totalSessions
  const estimatedMinutes = Math.round(avgMessages * 2.5)

  if (estimatedMinutes >= 60) {
    const hours = Math.floor(estimatedMinutes / 60)
    const minutes = estimatedMinutes % 60
    return `${hours}h ${minutes}m`
  }
  return `${estimatedMinutes}m`
}

function getToolCallsPerSession(
  dailyActivity: readonly {
    sessionCount: number
    toolCallCount: number
  }[]
): string {
  const recent = dailyActivity.slice(-30)
  const totalSessions = recent.reduce((sum, d) => sum + d.sessionCount, 0)
  const totalToolCalls = recent.reduce((sum, d) => sum + d.toolCallCount, 0)

  if (totalSessions === 0) return "0"
  return Math.round(totalToolCalls / totalSessions).toLocaleString()
}

export default function ProductivityPage() {
  const { data: stats, isLoading: statsLoading } = useStats()
  const { data: historyData, isLoading: historyLoading } = useHistory(500)

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Productivity</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Workflow metrics and coding patterns
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[180px] rounded-lg" />
      </div>
    )
  }

  const dailyActivity = stats?.dailyActivity ?? []
  const streak = calculateStreak(dailyActivity)
  const messagesThisWeek = getMessagesThisWeek(dailyActivity)
  const avgDuration = getAvgSessionDuration(dailyActivity)
  const toolCallsPerSession = getToolCallsPerSession(dailyActivity)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Productivity</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Workflow metrics and coding patterns
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Current Streak"
          value={`${streak} day${streak !== 1 ? "s" : ""}`}
          subtitle="consecutive days with activity"
          icon={Flame}
        />
        <StatCard
          title="Messages This Week"
          value={messagesThisWeek.toLocaleString()}
          subtitle="since Monday"
          icon={MessageSquare}
        />
        <StatCard
          title="Avg Session Duration"
          value={avgDuration}
          subtitle="last 30 days"
          icon={Clock}
        />
        <StatCard
          title="Tool Calls / Session"
          value={toolCallsPerSession}
          subtitle="last 30 days"
          icon={Wrench}
        />
      </div>

      {/* Activity Heatmap - Full Width */}
      <ActivityHeatmap
        dailyActivity={dailyActivity}
        isLoading={statsLoading}
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SessionDurationChart
          dailyActivity={dailyActivity}
          isLoading={statsLoading}
        />
        <PeakHoursChart
          hourCounts={stats?.hourCounts ?? {}}
          isLoading={statsLoading}
        />
      </div>

      {/* Tool Frequency - Full Width */}
      <ToolFrequencyChart
        entries={historyData?.entries ?? []}
        isLoading={historyLoading}
      />
    </div>
  )
}
