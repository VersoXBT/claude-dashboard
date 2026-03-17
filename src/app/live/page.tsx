"use client"

import { useActiveSessions } from "@/hooks/use-dashboard-data"
import { ActiveSessionCard } from "@/features/live/active-session-card"
import { EmptyState } from "@/features/live/empty-state"
import { Skeleton } from "@/components/ui/skeleton"

export default function LivePage() {
  const { data, isLoading } = useActiveSessions()

  const sessions = data?.sessions ?? []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Live Monitor</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Real-time active session monitoring
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[160px] rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Live Monitor</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Real-time active session monitoring
          </p>
        </div>
        {sessions.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-emerald-400">
              {sessions.length} active
            </span>
          </div>
        )}
      </div>

      {sessions.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sessions.map((session) => (
            <ActiveSessionCard key={session.sessionId} session={session} />
          ))}
        </div>
      )}
    </div>
  )
}
