"use client"

import { Terminal } from "lucide-react"

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="relative mb-6">
        <div className="absolute inset-0 scale-150 rounded-full bg-[#D4714E]/5 animate-[pulse_3s_ease-in-out_infinite]" />
        <div className="absolute inset-0 scale-125 rounded-full bg-[#D4714E]/8 animate-[pulse_3s_ease-in-out_infinite_0.5s]" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#231F1B] border border-[#3D3830]">
          <Terminal className="h-8 w-8 text-[#D4714E]" />
        </div>
      </div>
      <h3 className="text-lg font-medium text-[#B8AFA5] mb-2">
        No active sessions
      </h3>
      <p className="text-sm text-[#7A7267] max-w-xs text-center leading-relaxed">
        Start a Claude Code session in your terminal to see it appear here in real time.
      </p>
      <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#231F1B] border border-[#302C26]">
        <span className="text-xs font-mono text-[#7A7267]">$</span>
        <span className="text-xs font-mono text-[#D4714E]">claude</span>
      </div>
    </div>
  )
}
