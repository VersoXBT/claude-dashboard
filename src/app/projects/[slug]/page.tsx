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
    <div className="rounded-lg border border-[#3D3830] bg-[#2D2822] px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-[#F5F0EB]">{label}</p>
      <p className="text-[#B8AFA5]">{payload[0].value} session{payload[0].value !== 1 ? "s" : ""}</p>
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
        <Skeleton className="h-8 w-64 rounded-lg bg-[#2D2822]" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[80px] rounded-lg bg-[#2D2822]" />
          ))}
        </div>
        <Skeleton className="h-[300px] rounded-lg bg-[#2D2822]" />
        <Skeleton className="h-[400px] rounded-lg bg-[#2D2822]" />
      </div>
    )
  }

  if (!project && !projectsLoading) {
    return (
      <div className="space-y-6">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-[#B8AFA5] hover:text-[#D4714E] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
        <div className="text-center py-16 text-[#7A7267]">
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
        className="inline-flex items-center gap-1.5 text-sm text-[#B8AFA5] hover:text-[#D4714E] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D4714E]/10 border border-[#D4714E]/20">
              <FolderKanban className="h-5 w-5 text-[#D4714E]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#F5F0EB]">{project?.name}</h1>
              <p className="text-xs text-[#7A7267] font-mono">{project?.path}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#231F1B]/50 border-[#3D3830]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FolderKanban className="h-3.5 w-3.5 text-[#D4714E]" />
              <span className="text-xs text-[#B8AFA5]">Sessions</span>
            </div>
            <p className="text-lg font-bold text-[#F5F0EB]">
              {formatNumber(project?.sessionCount ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#231F1B]/50 border-[#3D3830]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="h-3.5 w-3.5 text-[#D4714E]" />
              <span className="text-xs text-[#B8AFA5]">Messages</span>
            </div>
            <p className="text-lg font-bold text-[#F5F0EB]">
              {formatNumber(project?.totalMessages ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#231F1B]/50 border-[#3D3830]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <GitBranch className="h-3.5 w-3.5 text-[#D4714E]" />
              <span className="text-xs text-[#B8AFA5]">Branches</span>
            </div>
            <p className="text-lg font-bold text-[#F5F0EB]">
              {Object.keys(branchCounts).length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#231F1B]/50 border-[#3D3830]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-3.5 w-3.5 text-[#D4714E]" />
              <span className="text-xs text-[#B8AFA5]">Last Active</span>
            </div>
            <p className="text-lg font-bold text-[#F5F0EB]">
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
              <CartesianGrid strokeDasharray="3 3" stroke="#3D3830" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#7A7267", fontSize: 11 }} stroke="#3D3830" />
              <YAxis
                type="category"
                dataKey="branch"
                tick={{ fill: "#B8AFA5", fontSize: 11 }}
                stroke="#3D3830"
                width={150}
              />
              <Tooltip content={<BranchTooltipContent />} />
              <Bar dataKey="sessions" fill="#D4714E" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}

      <Card className="bg-[#231F1B]/50 border-[#3D3830]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-[#F5F0EB]">
            Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {sessionsLoading && sessions.length === 0 ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded bg-[#2D2822]" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-[#7A7267] text-center py-8">No sessions found</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-[#302C26] hover:bg-transparent bg-[#2D2822]">
                    <TableHead className="text-[#B8AFA5]">Summary</TableHead>
                    <TableHead className="text-[#B8AFA5]">Branch</TableHead>
                    <TableHead className="text-[#B8AFA5] text-right">Messages</TableHead>
                    <TableHead className="text-[#B8AFA5] text-right">Last Modified</TableHead>
                    <TableHead className="text-[#B8AFA5] text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session, index) => (
                    <TableRow
                      key={session.sessionId}
                      className={`border-[#302C26] hover:bg-[#2D2822] ${index % 2 === 0 ? "bg-[#231F1B]" : "bg-[#1E1B17]"}`}
                    >
                      <TableCell className="max-w-[300px]">
                        <Link
                          href={`/sessions/${session.sessionId}`}
                          className="text-[#F5F0EB] hover:text-[#D4714E] transition-colors text-sm"
                        >
                          {session.summary || session.firstPrompt
                            ? (session.summary || session.firstPrompt).slice(0, 80) +
                              ((session.summary || session.firstPrompt).length > 80 ? "..." : "")
                            : session.sessionId.slice(0, 12)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {session.gitBranch ? (
                          <Badge variant="outline" className="text-xs font-mono border-[#3D3830] text-[#B8AFA5] bg-transparent">
                            {session.gitBranch}
                          </Badge>
                        ) : (
                          <span className="text-xs text-[#564F47]">--</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-[#B8AFA5] font-mono text-xs">
                        {session.messageCount}
                      </TableCell>
                      <TableCell className="text-right text-[#7A7267] text-xs">
                        {getRelativeTime(session.modified)}
                      </TableCell>
                      <TableCell className="text-center">
                        {session.isActive ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E8956A] opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4714E]" />
                            </span>
                            <span className="text-xs text-[#D4714E]">Active</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#564F47]">Ended</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#3D3830]">
                  <p className="text-xs text-[#7A7267]">
                    Page {page} of {totalPages} ({sessionsData?.total ?? 0} sessions)
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="px-3 py-1.5 text-xs rounded-md bg-[#2D2822] text-[#B8AFA5] border border-[#3D3830] hover:bg-[#3D3830] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="px-3 py-1.5 text-xs rounded-md bg-[#2D2822] text-[#B8AFA5] border border-[#3D3830] hover:bg-[#3D3830] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
