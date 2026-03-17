import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { projectAnalyticsQuery } from './project-analytics.queries'
import { ProjectTable } from './ProjectTable'
import { formatDuration } from '@/lib/utils/format'
import { usePrivacy } from '@/features/privacy/PrivacyContext'
import { statsQuery } from '@/features/stats/stats.queries'
import { useSessionCost } from '@/features/cost-estimation/useSessionCost'
import type { TokenUsage } from '@/lib/parsers/types'

const EMPTY_TOKENS_BY_MODEL: Record<string, TokenUsage> = {}

export function ProjectAnalytics() {
  const { anonymizeProjectName } = usePrivacy()
  const { data, isLoading } = useQuery(projectAnalyticsQuery)
  const { data: stats } = useQuery(statsQuery)

  // Build global tokensByModel for cost calculation
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

  // Compute estimated cost per message from global stats
  const costPerMessage = useMemo(() => {
    if (!cost || !stats || stats.totalMessages === 0) return 0
    return cost.totalUSD / stats.totalMessages
  }, [cost, stats])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-gray-900/50"
            />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-gray-900/50" />
      </div>
    )
  }

  const projects = data?.projects ?? []

  if (projects.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        No projects found. Sessions will appear here once scanned.
      </div>
    )
  }

  const totalSessions = projects.reduce((sum, p) => sum + p.totalSessions, 0)
  const totalDurationMs = projects.reduce((sum, p) => sum + p.totalDurationMs, 0)

  // Most active project by session count
  const mostActive = projects.reduce((max, p) =>
    p.totalSessions > max.totalSessions ? p : max,
  )

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard label="Total Projects" value={String(projects.length)} />
        <SummaryCard
          label="Total Sessions"
          value={totalSessions.toLocaleString()}
        />
        <SummaryCard
          label="Total Duration"
          value={formatDuration(totalDurationMs)}
        />
        <SummaryCard
          label="Most Active"
          value={anonymizeProjectName(mostActive.projectName)}
          sub={`${mostActive.totalSessions} sessions`}
        />
      </div>

      {/* Project table */}
      <ProjectTable projects={projects} costPerMessage={costPerMessage} />
    </div>
  )
}

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 truncate text-xl font-bold text-gray-100">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
    </div>
  )
}
