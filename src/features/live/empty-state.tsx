"use client"

import { Terminal } from "lucide-react"

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="relative mb-6">
        <div className="absolute inset-0 animate-pulse rounded-full bg-zinc-700/20 blur-xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700">
          <Terminal className="h-8 w-8 text-zinc-500" />
        </div>
      </div>
      <h3 className="text-lg font-medium text-zinc-400 mb-2">
        No active sessions
      </h3>
      <p className="text-sm text-zinc-500 max-w-xs text-center">
        Start a Claude Code session in your terminal to see it appear here in real time.
      </p>
    </div>
  )
}
