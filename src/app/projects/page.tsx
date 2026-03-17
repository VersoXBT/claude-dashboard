"use client"

import { useProjects } from "@/hooks/use-dashboard-data"
import { StatCard } from "@/components/data-display/stat-card"
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
import { FolderKanban, Trophy, Terminal, MessageSquare } from "lucide-react"
import { Treemap, ResponsiveContainer, Tooltip } from "recharts"
import Link from "next/link"
import type { ProjectResponse } from "@/lib/types"

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

function getDaysSinceActive(dateStr: string): number {
  if (!dateStr) return Infinity
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  return Math.floor((now - then) / (1000 * 60 * 60 * 24))
}

function getActivityColor(dateStr: string): { dot: string; label: string } {
  const days = getDaysSinceActive(dateStr)
  if (days <= 1) return { dot: "bg-emerald-500", label: "Active" }
  if (days <= 7) return { dot: "bg-amber-500", label: "Recent" }
  return { dot: "bg-red-500", label: "Stale" }
}

function getTreemapFill(days: number): string {
  if (days <= 1) return "#10b981"
  if (days <= 7) return "#f59e0b"
  return "#ef4444"
}

interface TreemapNodeProps {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly name: string
  readonly days: number
}

function CustomTreemapNode({ x, y, width, height, name, days }: TreemapNodeProps) {
  const fill = getTreemapFill(days)
  const showLabel = width > 60 && height > 30

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        fillOpacity={0.85}
        stroke="#18181b"
        strokeWidth={2}
        rx={4}
      />
      {showLabel && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          fontSize={Math.min(12, width / 8)}
          fontWeight={500}
        >
          {name.length > width / 7 ? `${name.slice(0, Math.floor(width / 7))}...` : name}
        </text>
      )}
    </g>
  )
}

interface TreemapTooltipProps {
  readonly active?: boolean
  readonly payload?: readonly { readonly payload: { readonly name: string; readonly sessions: number; readonly days: number } }[]
}

function TreemapTooltipContent({ active, payload }: TreemapTooltipProps) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-zinc-100">{data.name}</p>
      <p className="text-zinc-400">{data.sessions} session{data.sessions !== 1 ? "s" : ""}</p>
      <p className="text-zinc-400">
        {data.days === 0 ? "Active today" : `${data.days}d since last activity`}
      </p>
    </div>
  )
}

function findMostActive(projects: readonly ProjectResponse[]): string {
  if (projects.length === 0) return "N/A"
  const sorted = [...projects].sort((a, b) => b.sessionCount - a.sessionCount)
  return sorted[0].name
}

export default function ProjectsPage() {
  const { data, isLoading } = useProjects()
  const projects = data?.projects ?? []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Projects</h1>
          <p className="text-sm text-zinc-500 mt-1">Project leaderboard and cross-project analytics</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-lg" />
      </div>
    )
  }

  const totalSessions = projects.reduce((sum, p) => sum + p.sessionCount, 0)
  const totalMessages = projects.reduce((sum, p) => sum + p.totalMessages, 0)
  const mostActive = findMostActive(projects)

  const treemapData = projects
    .filter((p) => p.sessionCount > 0)
    .map((p) => ({
      name: p.name,
      size: p.sessionCount,
      sessions: p.sessionCount,
      days: getDaysSinceActive(p.lastActivity),
    }))

  const rankedProjects = [...projects].sort((a, b) => b.sessionCount - a.sessionCount)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Projects</h1>
        <p className="text-sm text-zinc-500 mt-1">Project leaderboard and cross-project analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Projects"
          value={formatNumber(projects.length)}
          subtitle="tracked projects"
          icon={FolderKanban}
        />
        <StatCard
          title="Most Active"
          value={mostActive.length > 18 ? `${mostActive.slice(0, 18)}...` : mostActive}
          subtitle="highest session count"
          icon={Trophy}
        />
        <StatCard
          title="Total Sessions"
          value={formatNumber(totalSessions)}
          subtitle="across all projects"
          icon={Terminal}
        />
        <StatCard
          title="Total Messages"
          value={formatNumber(totalMessages)}
          subtitle="across all projects"
          icon={MessageSquare}
        />
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-300">
            Project Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {rankedProjects.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">No projects found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400 w-16">#</TableHead>
                  <TableHead className="text-zinc-400">Project</TableHead>
                  <TableHead className="text-zinc-400 text-right">Sessions</TableHead>
                  <TableHead className="text-zinc-400 text-right">Messages</TableHead>
                  <TableHead className="text-zinc-400 text-right">Last Active</TableHead>
                  <TableHead className="text-zinc-400 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankedProjects.map((project, index) => {
                  const activity = getActivityColor(project.lastActivity)
                  return (
                    <TableRow
                      key={project.id}
                      className="border-zinc-800/50 hover:bg-zinc-800/30"
                    >
                      <TableCell className="text-zinc-500 font-mono text-xs">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/projects/${encodeURIComponent(project.id)}`}
                          className="text-zinc-100 hover:text-violet-400 transition-colors font-medium"
                        >
                          {project.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right text-zinc-300 font-mono text-xs">
                        {formatNumber(project.sessionCount)}
                      </TableCell>
                      <TableCell className="text-right text-zinc-300 font-mono text-xs">
                        {formatNumber(project.totalMessages)}
                      </TableCell>
                      <TableCell className="text-right text-zinc-400 text-xs">
                        {getRelativeTime(project.lastActivity)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${activity.dot}`} />
                          <span className="text-xs text-zinc-400">{activity.label}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ChartContainer
        title="Project Activity Treemap"
        subtitle="Block size = session count, color = recency (green: recent, amber: >7d, red: >30d)"
        isEmpty={treemapData.length === 0}
        height="h-[350px]"
      >
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={treemapData}
            dataKey="size"
            stroke="#18181b"
            content={<CustomTreemapNode x={0} y={0} width={0} height={0} name="" days={0} />}
          >
            <Tooltip content={<TreemapTooltipContent />} />
          </Treemap>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}
