"use client"

import { useStats, useActiveSessions } from "@/hooks/use-dashboard-data"
import { StatCard } from "@/components/data-display/stat-card"
import { TokenUsageChart } from "@/features/overview/token-usage-chart"
import { CostByModelChart } from "@/features/overview/cost-by-model-chart"
import { ActivityHeatmap } from "@/features/overview/activity-heatmap"
import { PeakHoursChart } from "@/features/overview/peak-hours-chart"
import { RecentSessionsTable } from "@/features/overview/recent-sessions-table"
import { DollarSign, Terminal, Zap, Flame } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function formatCost(n: number): string {
  return `$${n.toFixed(2)}`
}

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

export default function OverviewPage() {
  const { data: stats, isLoading: statsLoading } = useStats()
  const { data: activeData } = useActiveSessions()

  const activeSessions = activeData?.sessions?.length ?? 0

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Overview</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Your Claude Code usage at a glance
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <Skeleton className="xl:col-span-8 h-[400px] rounded-lg" />
          <Skeleton className="xl:col-span-4 h-[400px] rounded-lg" />
        </div>
      </div>
    )
  }

  const streak = stats ? calculateStreak(stats.dailyActivity) : 0
  const totalTokens = stats
    ? Object.values(stats.modelUsage).reduce(
        (sum, m) => sum + m.inputTokens + m.outputTokens,
        0
      )
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Overview</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Your Claude Code usage at a glance
          </p>
        </div>
        {activeSessions > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-emerald-400">
              {activeSessions} active session{activeSessions !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Estimated Spend"
          value={formatCost(stats?.estimatedCosts.totalCost ?? 0)}
          subtitle="API-equivalent cost"
          delta={`$${(stats?.estimatedCosts.costToday ?? 0).toFixed(2)} today`}
          deltaType="neutral"
          icon={DollarSign}
        />
        <StatCard
          title="Total Sessions"
          value={formatNumber(stats?.totalSessions ?? 0)}
          subtitle="all time"
          delta={`${activeSessions} active now`}
          deltaType={activeSessions > 0 ? "positive" : "neutral"}
          icon={Terminal}
        />
        <StatCard
          title="Total Tokens"
          value={formatNumber(totalTokens)}
          subtitle="input + output"
          delta={`${formatNumber(stats?.totalMessages ?? 0)} messages`}
          deltaType="neutral"
          icon={Zap}
        />
        <StatCard
          title="Coding Streak"
          value={`${streak} day${streak !== 1 ? "s" : ""}`}
          subtitle="consecutive days active"
          icon={Flame}
        />
      </div>

      {/* Row 2: Token Usage (8 col) + Cost by Model (4 col) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8">
          {stats && (
            <TokenUsageChart
              modelUsage={stats.modelUsage}
              dailyActivity={stats.dailyActivity}
            />
          )}
        </div>
        <div className="xl:col-span-4">
          {stats && (
            <CostByModelChart dailyModelTokens={stats.dailyModelTokens} />
          )}
        </div>
      </div>

      {/* Row 3: Activity Heatmap (8 col) + Peak Hours (4 col) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8">
          {stats && (
            <ActivityHeatmap dailyActivity={stats.dailyActivity} />
          )}
        </div>
        <div className="xl:col-span-4">
          {stats && <PeakHoursChart hourCounts={stats.hourCounts} />}
        </div>
      </div>

      {/* Row 4: Recent Sessions */}
      <RecentSessionsTable />
    </div>
  )
}
