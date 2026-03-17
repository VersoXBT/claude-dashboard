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
    <Card className="bg-[#231F1B] border-[#3D3830] hover:bg-[#2D2822] transition-colors relative overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-[3px] bg-[#D4714E]/60" />
      <CardContent className="p-5 pl-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E8956A] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D4714E]" />
            </span>
            <span className="text-lg font-semibold text-[#F5F0EB]">
              {session.projectName}
            </span>
          </div>
          <span className="text-xs font-mono text-[#7A7267]">
            {truncateSessionId(session.sessionId)}
          </span>
        </div>

        <div className="text-xs text-[#7A7267] font-mono mb-4 truncate">
          {session.cwd}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-[#B8AFA5]">Duration</span>
          <span className="text-lg font-mono font-bold text-[#E8956A] tabular-nums">
            {formatDuration(elapsed)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
