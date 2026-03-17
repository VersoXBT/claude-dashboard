import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { formatDistanceToNow } from 'date-fns'
import { recentPromptsQuery } from './sessions.queries'
import { usePrivacy } from '@/features/privacy/PrivacyContext'

function extractProjectName(projectPath: string): string {
  const parts = projectPath.split('/')
  return parts[parts.length - 1] || projectPath
}

export function RecentPromptsPanel() {
  const { privacyMode, anonymizeProjectName } = usePrivacy()
  const { data: prompts, isLoading } = useQuery(recentPromptsQuery)

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
        <h2 className="text-sm font-semibold text-gray-100">Recent Prompts</h2>
        <div className="mt-3 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg bg-gray-800/50"
            />
          ))}
        </div>
      </div>
    )
  }

  if (!prompts || prompts.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
        <h2 className="text-sm font-semibold text-gray-100">Recent Prompts</h2>
        <p className="mt-3 text-center text-sm text-gray-500">
          No history found in ~/.claude/history.jsonl
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
      <h2 className="text-sm font-semibold text-gray-100">Recent Prompts</h2>
      <div className="mt-3 space-y-1">
        {prompts.map((entry, idx) => {
          const projectName = extractProjectName(entry.project)
          const displayProject = privacyMode
            ? anonymizeProjectName(projectName)
            : projectName

          return (
            <Link
              key={`${entry.sessionId}-${entry.timestamp}-${idx}`}
              to="/sessions/$sessionId"
              params={{ sessionId: entry.sessionId }}
              search={{ project: entry.project }}
              className="group block rounded-lg px-3 py-2 transition-colors hover:bg-gray-800/50"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 flex-1 truncate text-sm text-gray-200 group-hover:text-gray-100">
                  {entry.display}
                </p>
                <span className="shrink-0 text-xs text-gray-500">
                  {formatDistanceToNow(new Date(entry.timestamp), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-gray-500">
                {displayProject}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
