"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSessions, useProjects } from "@/hooks/use-dashboard-data"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Search,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { SessionListItem } from "@/lib/types"

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

function formatDuration(created: string, modified: string): string {
  const start = new Date(created).getTime()
  const end = new Date(modified).getTime()
  const diffMs = Math.max(0, end - start)
  const minutes = Math.floor(diffMs / 60_000)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m`
  return "<1m"
}

type SortField = "modified" | "created"
type SortOrder = "desc" | "asc"

export default function SessionsPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [project, setProject] = useState<string>("")
  const [sort, setSort] = useState<SortField>("modified")
  const [order, setOrder] = useState<SortOrder>("desc")
  const [page, setPage] = useState(1)

  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useSessions({
    page,
    limit: 20,
    project: project || undefined,
    search: debouncedSearch || undefined,
    sort,
    order,
  })

  const { data: projectsData } = useProjects()

  const projectNames = useMemo(() => {
    if (!projectsData?.projects) return []
    return projectsData.projects.map((p) => p.name)
  }, [projectsData])

  const handleRowClick = useCallback(
    (sessionId: string) => {
      router.push(`/sessions/${sessionId}`)
    },
    [router]
  )

  const toggleOrder = useCallback(() => {
    setOrder((prev) => (prev === "desc" ? "asc" : "desc"))
    setPage(1)
  }, [])

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value)
      setPage(1)
    },
    []
  )

  const handleProjectChange = useCallback((val: string | null) => {
    setProject(val ?? "")
    setPage(1)
  }, [])

  const handleSortChange = useCallback((val: string | null) => {
    if (val === "modified" || val === "created") {
      setSort(val)
      setPage(1)
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#F5F0EB]">Sessions</h1>
        <p className="text-sm text-[#7A7267] mt-1">
          Browse and search all Claude Code sessions
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7A7267]" />
          <Input
            placeholder="Search sessions..."
            value={search}
            onChange={handleSearchChange}
            className="pl-9 bg-[#231F1B] border-[#3D3830] text-[#F5F0EB] placeholder:text-[#7A7267] focus-visible:ring-[#D4714E]/50 focus-visible:border-[#D4714E]"
          />
        </div>
        <div className="flex gap-2">
          <Select value={project} onValueChange={handleProjectChange}>
            <SelectTrigger className="bg-[#231F1B] border-[#3D3830] text-[#B8AFA5] min-w-[140px]">
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent className="bg-[#2D2822] border-[#3D3830]">
              <SelectItem value="">All projects</SelectItem>
              {projectNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={handleSortChange}>
            <SelectTrigger className="bg-[#231F1B] border-[#3D3830] text-[#B8AFA5] min-w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2D2822] border-[#3D3830]">
              <SelectItem value="modified">Modified</SelectItem>
              <SelectItem value="created">Created</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleOrder}
            className="bg-[#231F1B] border-[#3D3830] text-[#B8AFA5] hover:bg-[#2D2822] hover:text-[#F5F0EB]"
          >
            {order === "desc" ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <SessionsTableSkeleton />
      ) : !data?.sessions.length ? (
        <div className="text-center py-16 text-[#7A7267]">
          <p className="text-lg font-medium">No sessions found</p>
          <p className="text-sm mt-1">
            {debouncedSearch
              ? "Try adjusting your search terms"
              : "Sessions will appear here as you use Claude Code"}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-[#3D3830] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-[#302C26] hover:bg-transparent bg-[#2D2822]">
                  <TableHead className="w-[40px] text-[#B8AFA5]">Status</TableHead>
                  <TableHead className="text-[#B8AFA5]">Project</TableHead>
                  <TableHead className="min-w-[250px] text-[#B8AFA5]">Summary</TableHead>
                  <TableHead className="text-right text-[#B8AFA5]">Messages</TableHead>
                  <TableHead className="text-[#B8AFA5]">Duration</TableHead>
                  <TableHead className="text-[#B8AFA5]">Branch</TableHead>
                  <TableHead className="text-[#B8AFA5]">Started</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.sessions.map((session, index) => (
                  <SessionRow
                    key={session.sessionId}
                    session={session}
                    onClick={handleRowClick}
                    isEven={index % 2 === 0}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-[#7A7267]">
              Showing {(data.page - 1) * data.limit + 1}-
              {Math.min(data.page * data.limit, data.total)} of {data.total}{" "}
              sessions
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={data.page <= 1}
                className="bg-[#231F1B] border-[#3D3830] text-[#B8AFA5] hover:bg-[#2D2822] hover:text-[#F5F0EB] disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-[#B8AFA5] px-2">
                {data.page} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={data.page >= data.totalPages}
                className="bg-[#231F1B] border-[#3D3830] text-[#B8AFA5] hover:bg-[#2D2822] hover:text-[#F5F0EB] disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function SessionRow({
  session,
  onClick,
  isEven,
}: {
  readonly session: SessionListItem
  readonly onClick: (id: string) => void
  readonly isEven: boolean
}) {
  return (
    <TableRow
      className={`border-[#302C26] cursor-pointer hover:bg-[#2D2822] ${isEven ? "bg-[#231F1B]" : "bg-[#1E1B17]"}`}
      onClick={() => onClick(session.sessionId)}
    >
      <TableCell>
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            session.isActive
              ? "bg-[#D4714E] shadow-[0_0_6px_rgba(212,113,78,0.6)]"
              : "bg-[#564F47]"
          }`}
        />
      </TableCell>
      <TableCell>
        <Badge className="text-xs bg-[#D4A04E]/15 text-[#D4A04E] border-[#D4A04E]/30 hover:bg-[#D4A04E]/25">
          {session.projectName}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-[#F5F0EB]">
          {truncate(session.summary || session.firstPrompt || "Untitled", 60)}
        </span>
      </TableCell>
      <TableCell className="text-right text-[#B8AFA5]">
        {session.messageCount}
      </TableCell>
      <TableCell className="text-[#B8AFA5]">
        {formatDuration(session.created, session.modified)}
      </TableCell>
      <TableCell>
        {session.gitBranch ? (
          <Badge variant="outline" className="text-xs font-mono border-[#3D3830] text-[#B8AFA5] bg-transparent">
            {truncate(session.gitBranch, 20)}
          </Badge>
        ) : (
          <span className="text-[#564F47]">--</span>
        )}
      </TableCell>
      <TableCell className="text-[#B8AFA5]">
        {formatDistanceToNow(new Date(session.created), { addSuffix: true })}
      </TableCell>
    </TableRow>
  )
}

function SessionsTableSkeleton() {
  return (
    <div className="rounded-lg border border-[#3D3830] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-[#302C26] hover:bg-transparent bg-[#2D2822]">
            <TableHead className="w-[40px] text-[#B8AFA5]">Status</TableHead>
            <TableHead className="text-[#B8AFA5]">Project</TableHead>
            <TableHead className="min-w-[250px] text-[#B8AFA5]">Summary</TableHead>
            <TableHead className="text-right text-[#B8AFA5]">Messages</TableHead>
            <TableHead className="text-[#B8AFA5]">Duration</TableHead>
            <TableHead className="text-[#B8AFA5]">Branch</TableHead>
            <TableHead className="text-[#B8AFA5]">Started</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }).map((_, i) => (
            <TableRow key={i} className={`border-[#302C26] ${i % 2 === 0 ? "bg-[#231F1B]" : "bg-[#1E1B17]"}`}>
              <TableCell>
                <Skeleton className="h-2 w-2 rounded-full bg-[#2D2822]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20 bg-[#2D2822]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-64 bg-[#2D2822]" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-4 w-8 ml-auto bg-[#2D2822]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-12 bg-[#2D2822]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-24 bg-[#2D2822]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20 bg-[#2D2822]" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
