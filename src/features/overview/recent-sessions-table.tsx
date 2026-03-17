"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChartContainer } from "@/components/charts/chart-container"
import { Badge } from "@/components/ui/badge"
import { useSessions } from "@/hooks/use-dashboard-data"

function formatDuration(created: string, modified: string): string {
  const start = new Date(created).getTime()
  const end = new Date(modified).getTime()
  const ms = end - start
  if (ms < 0) return "0m"
  const minutes = Math.floor(ms / 60000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remainingMin = minutes % 60
  return `${hours}h ${remainingMin}m`
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + "..."
}

export function RecentSessionsTable() {
  const { data, isLoading } = useSessions({ limit: 10, sort: "modified", order: "desc" })

  const sessions = data?.sessions ?? []

  return (
    <ChartContainer
      title="Recent Sessions"
      subtitle="Last 10 coding sessions"
      height="h-auto"
      isLoading={isLoading}
      isEmpty={sessions.length === 0}
    >
      <Table>
        <TableHeader>
          <TableRow className="border-[#3D3830] hover:bg-transparent">
            <TableHead className="text-[#B8AFA5] text-xs">Project</TableHead>
            <TableHead className="text-[#B8AFA5] text-xs">Summary</TableHead>
            <TableHead className="text-[#B8AFA5] text-xs text-right">Messages</TableHead>
            <TableHead className="text-[#B8AFA5] text-xs text-right">Duration</TableHead>
            <TableHead className="text-[#B8AFA5] text-xs text-right">Last Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow
              key={session.sessionId}
              className="border-[#302C26] hover:bg-[#2D2822]/50"
            >
              <TableCell className="text-[#F5F0EB] text-xs font-medium">
                <div className="flex items-center gap-2">
                  {session.projectName}
                  {session.isActive && (
                    <Badge
                      variant="outline"
                      className="text-[#E8956A] border-[#D4714E]/30 text-[10px] px-1.5 py-0"
                    >
                      active
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-[#B8AFA5] text-xs max-w-[300px]">
                {truncate(session.summary || session.firstPrompt || "No summary", 80)}
              </TableCell>
              <TableCell className="text-[#F5F0EB] text-xs text-right tabular-nums">
                {session.messageCount}
              </TableCell>
              <TableCell className="text-[#B8AFA5] text-xs text-right tabular-nums">
                {formatDuration(session.created, session.modified)}
              </TableCell>
              <TableCell className="text-[#7A7267] text-xs text-right">
                {formatRelativeTime(session.modified)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ChartContainer>
  )
}
