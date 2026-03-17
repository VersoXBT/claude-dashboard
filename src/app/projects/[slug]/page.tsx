"use client"

import { useParams } from "next/navigation"
import { useProjects, useSessions } from "@/hooks/use-dashboard-data"
import { ChartContainer } from "@/components/charts/chart-container"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import Link from "next/link"
import { ArrowLeft, FolderKanban, GitBranch, Clock, MessageSquare } from "lucide-react"
import { useState } from "react"

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function getRelativeTime(dateStr: string): string {
  if (!dateStr) return "Never"
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60_000)
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays}d ago`
  const diffMonths = Math.floor(diffDays / 30)
  return `${diffMonths}mo ago`
}

interface BarTooltipProps {
  readonly active?: boolean
  readonly payload?: readonly { readonly value: number }[]
  readonly label?: string
}

function BranchTooltipContent({ active, payload, label }: BarTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-zinc-100">{label}</p>
      <p className="text-zinc-400">{payload[0].value} session{payload[0].value !== 1 ? "s" : ""}</p>
    </div>
  )
}

export default function ProjectDetailPage() {
  const params = useParams()
  const slug = typeof params.slug === "string" ? decodeURIComponent(params.slug) : ""
  const [page, setPage] = useState(1)

  const { data: projectsData, isLoading: projectsLoading } = useProjects()
  const project = projectsData?.projects.find((p) => p.id === slug)
  const projectName = project?.name ?? slug

  const { data: sessionsData, isLoading: sessionsLoading } = useSessions({
    project: projectName,
    page,
    limit: 25,
    sort: "modified",
    order: "desc",
  })

  const sessions = sessionsData?.sessions ?? []
  const totalPages = sessionsData?.totalPages ?? 1

  const isLoading = projectsLoading || sessionsLoading

  if (isLoading && !project) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[80px] rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[300px] rounded-lg" />
        <Skeleton className="h-[400px] rounded-lg" />
      </div>
    )
  }

  if (!project && !projectsLoading) {
    return (
      <div className="space-y-6">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
        <div className="text-center py-16 text-zinc-500">
          <p className="text-lg font-medium">Project not found</p>
          <p className="text-sm mt-1">The project &quot;{slug}&quot; could not be found</p>
        </div>
      </div>
    )
  }

  const branchCounts: Record<string, number> = {}
  for (const session of sessions) {
    const branch = session.gitBranch || "(no branch)"
    branchCounts[branch] = (branchCounts[branch] ?? 0) + 1
  }

  const branchData = Object.entries(branchCounts)
    .map(([branch, count]) => ({ branch, sessions: count }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 15)

  return (
    <div className="space-y-6">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
              <FolderKanban className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-zinc-100">{project?.name}</h1>
              <p className="text-xs text-zinc-500 font-mono">{project?.path}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FolderKanban className="h-3.5 w-3.5 text-zinc-500" />
              <span className="text-xs text-zinc-400">Sessions</span>
            </div>
            <p className="text-lg font-bold text-zinc-100">
              {formatNumber(project?.sessionCount ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />
              <span className="text-xs text-zinc-400">Messages</span>
            </div>
            <p className="text-lg font-bold text-zinc-100">
              {formatNumber(project?.totalMessages ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <GitBranch className="h-3.5 w-3.5 text-zinc-500" />
              <span className="text-xs text-zinc-400">Branches</span>
            </div>
            <p className="text-lg font-bold text-zinc-100">
              {Object.keys(branchCounts).length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-3.5 w-3.5 text-zinc-500" />
              <span className="text-xs text-zinc-400">Last Active</span>
            </div>
            <p className="text-lg font-bold text-zinc-100">
              {getRelativeTime(project?.lastActivity ?? "")}
            </p>
          </CardContent>
        </Card>
      </div>

      {branchData.length > 0 && (
        <ChartContainer
          title="Branch Activity"
          subtitle="Session count per git branch"
          height="h-[280px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={branchData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#71717a", fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="branch"
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                width={150}
              />
              <Tooltip content={<BranchTooltipContent />} />
              <Bar dataKey="sessions" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-300">
            Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {sessionsLoading && sessions.length === 0 ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">No sessions found</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Summary</TableHead>
                    <TableHead className="text-zinc-400">Branch</TableHead>
                    <TableHead className="text-zinc-400 text-right">Messages</TableHead>
                    <TableHead className="text-zinc-400 text-right">Last Modified</TableHead>
                    <TableHead className="text-zinc-400 text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow
                      key={session.sessionId}
                      className="border-zinc-800/50 hover:bg-zinc-800/30"
                    >
                      <TableCell className="max-w-[300px]">
                        <Link
                          href={`/sessions/${session.sessionId}`}
                          className="text-zinc-100 hover:text-violet-400 transition-colors text-sm"
                        >
                          {session.summary || session.firstPrompt
                            ? (session.summary || session.firstPrompt).slice(0, 80) +
                              ((session.summary || session.firstPrompt).length > 80 ? "..." : "")
                            : session.sessionId.slice(0, 12)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {session.gitBranch ? (
                          <Badge variant="secondary" className="text-xs font-mono bg-zinc-800 text-zinc-300">
                            {session.gitBranch}
                          </Badge>
                        ) : (
                          <span className="text-xs text-zinc-600">--</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-zinc-300 font-mono text-xs">
                        {session.messageCount}
                      </TableCell>
                      <TableCell className="text-right text-zinc-400 text-xs">
                        {getRelativeTime(session.modified)}
                      </TableCell>
                      <TableCell className="text-center">
                        {session.isActive ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span className="text-xs text-emerald-400">Active</span>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-600">Ended</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
                  <p className="text-xs text-zinc-500">
                    Page {page} of {totalPages} ({sessionsData?.total ?? 0} sessions)
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="px-3 py-1.5 text-xs rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="px-3 py-1.5 text-xs rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
