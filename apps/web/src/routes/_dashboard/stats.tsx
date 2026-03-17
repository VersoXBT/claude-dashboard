import { useMemo, type ReactNode } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { statsQuery } from '@/features/stats/stats.queries'
import { projectAnalyticsQuery } from '@/features/project-analytics/project-analytics.queries'
import { ActivityChart } from '@/features/stats/ActivityChart'
import { ContributionHeatmap } from '@/features/stats/ContributionHeatmap'
import { TokenTrendChart } from '@/features/stats/TokenTrendChart'
import { ModelUsageChart } from '@/features/stats/ModelUsageChart'
import { HourlyDistribution } from '@/features/stats/HourlyDistribution'
import { CostTrendChart } from '@/features/stats/CostTrendChart'
import { CacheEfficiencyPanel } from '@/features/stats/CacheEfficiencyPanel'
import { SessionComplexityChart } from '@/features/stats/SessionComplexityChart'
import { WeeklyComparisonPanel } from '@/features/stats/WeeklyComparisonPanel'
import { ModelSwitchingChart } from '@/features/stats/ModelSwitchingChart'
import { UsageStreakPanel } from '@/features/stats/UsageStreakPanel'
import { TokenEfficiencyPanel } from '@/features/stats/TokenEfficiencyPanel'
import { CodingVelocityChart } from '@/features/stats/CodingVelocityChart'
import { AverageSessionPanel } from '@/features/stats/AverageSessionPanel'
import { ModelTrendsChart } from '@/features/stats/ModelTrendsChart'
import { ToolUsageOverviewChart } from '@/features/stats/ToolUsageOverviewChart'
import { SkillsOverviewPanel } from '@/features/stats/SkillsOverviewPanel'
import { ProjectAnalytics } from '@/features/project-analytics/ProjectAnalytics'
import { formatDuration, formatTokenCount, formatUSD } from '@/lib/utils/format'
import {
  dailyActivityToCSV,
  dailyTokensToCSV,
  modelUsageToCSV,
  statsToJSON,
  downloadFile,
} from '@/lib/utils/export-utils'
import { ExportDropdown } from '@/components/ExportDropdown'
import { useSessionCost } from '@/features/cost-estimation/useSessionCost'
import type { CostBreakdown } from '@/features/cost-estimation/cost-estimation.types'
import type { TokenUsage, StatsCache } from '@/lib/parsers/types'

const statsSearchSchema = z.object({
  tab: z.enum(['overview', 'projects']).default('overview').catch('overview'),
})

export const Route = createFileRoute('/_dashboard/stats')({
  validateSearch: statsSearchSchema,
  component: StatsPage,
})

const EMPTY_TOKENS_BY_MODEL: Record<string, TokenUsage> = {}

function StatsPage() {
  const { tab } = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data: stats, isLoading } = useQuery(statsQuery)

  // Convert stats.modelUsage to Record<string, TokenUsage> for cost calculation
  // All hooks must be called before any early returns
  const tokensByModel = useMemo(() => {
    if (!stats) return EMPTY_TOKENS_BY_MODEL
    const result: Record<string, TokenUsage> = {}
    for (const [model, usage] of Object.entries(stats.modelUsage)) {
      result[model] = {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        cacheReadInputTokens: usage.cacheReadInputTokens,
        cacheCreationInputTokens: usage.cacheCreationInputTokens,
      }
    }
    return result
  }, [stats])

  const { cost } = useSessionCost(tokensByModel)

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-50">Stats</h1>
          <p className="mt-1 text-sm text-gray-300">
            Usage analytics and project insights
          </p>
        </div>
        {tab === 'overview' && stats && (
          <ExportDropdown
            options={[
              {
                label: 'Daily Activity (CSV)',
                onClick: () =>
                  downloadFile(
                    dailyActivityToCSV(stats),
                    'daily-activity.csv',
                    'text/csv',
                  ),
              },
              {
                label: 'Token Usage (CSV)',
                onClick: () =>
                  downloadFile(
                    dailyTokensToCSV(stats),
                    'daily-tokens.csv',
                    'text/csv',
                  ),
              },
              {
                label: 'Model Usage (CSV)',
                onClick: () =>
                  downloadFile(
                    modelUsageToCSV(stats),
                    'model-usage.csv',
                    'text/csv',
                  ),
              },
              {
                label: 'Full Stats (JSON)',
                onClick: () =>
                  downloadFile(
                    statsToJSON(stats),
                    'stats.json',
                    'application/json',
                  ),
              },
            ]}
          />
        )}
      </div>

      {/* Tab bar */}
      <div className="mt-4 flex gap-1 border-b border-gray-700">
        <button
          onClick={() => navigate({ search: { tab: 'overview' } })}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'overview'
              ? 'border-brand-500 text-gray-50'
              : 'border-transparent text-gray-300 hover:text-gray-100'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => navigate({ search: { tab: 'projects' } })}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'projects'
              ? 'border-brand-500 text-gray-50'
              : 'border-transparent text-gray-300 hover:text-gray-100'
          }`}
        >
          Projects
        </button>
      </div>

      {/* Tab content */}
      {tab === 'overview' ? (
        <StatsOverview stats={stats} isLoading={isLoading} cost={cost} />
      ) : (
        <div className="mt-6">
          <ProjectAnalytics />
        </div>
      )}
    </div>
  )
}

function StatsOverview({
  stats,
  isLoading,
  cost,
}: {
  stats: StatsCache | null | undefined
  isLoading: boolean
  cost: CostBreakdown | null
}) {
  const { data: projectData } = useQuery(projectAnalyticsQuery)

  if (isLoading) {
    return (
      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-gray-800/50"
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-gray-800/50"
            />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-xl bg-gray-800/50"
          />
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        No stats data found. Check ~/.claude/stats-cache.json
      </div>
    )
  }

  const totalTokens = Object.values(stats.modelUsage).reduce(
    (sum, m) => sum + m.inputTokens + m.outputTokens,
    0,
  )
  const totalToolCalls = stats.dailyActivity.reduce(
    (sum, d) => sum + d.toolCallCount,
    0,
  )
  const totalDurationMs =
    projectData?.projects.reduce((sum, p) => sum + p.totalDurationMs, 0) ?? 0
  const projectCount = projectData?.projects.length ?? 0

  return (
    <>
      {/* Row 1 — Key totals */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total Sessions" value={String(stats.totalSessions)} />
        <StatCard
          label="Total Messages"
          value={stats.totalMessages.toLocaleString()}
        />
        <StatCard label="Total Time" value={formatDuration(totalDurationMs)} />
        <StatCard label="Projects" value={String(projectCount)} />
      </div>

      {/* Row 2 — Deeper metrics */}
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Total Tokens"
          value={formatTokenCount(totalTokens)}
        />
        <StatCard
          label="Estimated Cost"
          value={cost ? `~${formatUSD(cost.totalUSD)}` : 'N/A'}
        />
        <StatCard
          label="Tool Calls"
          value={totalToolCalls.toLocaleString()}
        />
        <StatCard
          label="Longest Session"
          value={formatDuration(stats.longestSession.duration)}
          sub={`${stats.longestSession.messageCount} messages`}
        />
      </div>

      {/* Contribution heatmap */}
      <div className="mt-6">
        <ContributionHeatmap
          dailyActivity={stats.dailyActivity}
          dailyModelTokens={stats.dailyModelTokens}
        />
      </div>

      {/* Streaks + Weekly Comparison side by side */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <UsageStreakPanel data={stats.dailyActivity} />
        <WeeklyComparisonPanel data={stats.dailyActivity} />
      </div>

      {/* Coding Velocity */}
      <div className="mt-4">
        <CodingVelocityChart data={stats.dailyActivity} />
      </div>

      {/* Activity Chart */}
      <div className="mt-4">
        <ActivityChart data={stats.dailyActivity} />
      </div>

      {/* Tool Usage Overview */}
      <div className="mt-4">
        <ToolUsageOverviewChart
          toolFrequency={stats.toolFrequency}
          agentDispatches={stats.agentDispatches}
          planModeCount={stats.planModeCount}
        />
      </div>

      {/* Skills & Agents */}
      <div className="mt-4">
        <SkillsOverviewPanel
          skillInvocations={stats.skillInvocations}
          agentDispatches={stats.agentDispatches}
        />
      </div>

      {/* Session Averages + Token Efficiency side by side */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <AverageSessionPanel
          data={stats.dailyActivity}
          totalSessions={stats.totalSessions}
          totalMessages={stats.totalMessages}
          longestSession={stats.longestSession}
        />
        <TokenEfficiencyPanel modelUsage={stats.modelUsage} />
      </div>

      {/* Token Usage Over Time */}
      <div className="mt-4">
        <TokenTrendChart data={stats.dailyModelTokens} />
      </div>

      {/* Model Usage + Hourly Distribution */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <ModelUsageChart data={stats.modelUsage} />
        <HourlyDistribution hourCounts={stats.hourCounts} />
      </div>

      {/* Model breakdown + Model mix trends */}
      <div className="mt-4">
        <ModelSwitchingChart data={stats.modelUsage} />
      </div>

      <div className="mt-4">
        <ModelTrendsChart data={stats.dailyModelTokens} />
      </div>

      {/* Cost section */}
      {cost && (
        <>
          <div className="mt-4">
            <CostTrendChart
              data={stats.dailyModelTokens}
              modelUsage={stats.modelUsage}
              costBreakdown={cost}
            />
          </div>

          <div className="mt-4">
            <CacheEfficiencyPanel
              modelUsage={stats.modelUsage}
              costBreakdown={cost}
            />
          </div>
        </>
      )}

      {/* Complexity */}
      <div className="mt-4">
        <SessionComplexityChart data={stats.dailyActivity} />
      </div>
    </>
  )
}

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string
  value: string
  sub?: string
  icon?: ReactNode
}) {
  return (
    <div className="stat-card-hover rounded-xl border border-gray-700 border-l-2 border-l-brand-500 bg-gradient-to-br from-gray-800 to-gray-900 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-300">{label}</p>
        {icon && (
          <span className="text-gray-400">{icon}</span>
        )}
      </div>
      <p
        className="mt-1.5 text-2xl font-bold tracking-tight text-gray-50"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}
