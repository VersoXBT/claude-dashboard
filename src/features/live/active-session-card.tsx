"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import type { ActiveSession } from "@/lib/types"

interface ActiveSessionCardProps {
  readonly session: ActiveSession
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const pad = (n: number) => String(n).padStart(2, "0")

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`
  }
  return `${minutes}:${pad(seconds)}`
}

function truncateSessionId(sessionId: string): string {
  if (sessionId.length <= 12) return sessionId
  return `${sessionId.slice(0, 8)}...`
}

export function ActiveSessionCard({ session }: ActiveSessionCardProps) {
  const [elapsed, setElapsed] = useState(session.durationMs)

  useEffect(() => {
    const startTime = Date.now() - session.durationMs
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime)
    }, 1000)
    return () => clearInterval(interval)
  }, [session.durationMs])

  return (
    <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-lg font-semibold text-zinc-100">
              {session.projectName}
            </span>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            {truncateSessionId(session.sessionId)}
          </span>
        </div>

        <div className="text-xs text-zinc-500 font-mono mb-4 truncate">
          {session.cwd}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Duration</span>
          <span className="text-lg font-mono font-bold text-emerald-400 tabular-nums">
            {formatDuration(elapsed)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
