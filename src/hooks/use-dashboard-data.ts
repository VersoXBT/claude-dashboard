"use client"

import useSWR from "swr"
import type { StatsResponse, SessionListItem, ProjectResponse, ActiveSession, HistoryEntry } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useStats() {
  return useSWR<StatsResponse>("/api/stats", fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  })
}

export function useSessions(params?: {
  page?: number
  limit?: number
  project?: string
  search?: string
  sort?: string
  order?: string
}) {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  if (params?.project) searchParams.set("project", params.project)
  if (params?.search) searchParams.set("search", params.search)
  if (params?.sort) searchParams.set("sort", params.sort)
  if (params?.order) searchParams.set("order", params.order)

  const query = searchParams.toString()
  const key = `/api/sessions${query ? `?${query}` : ""}`

  return useSWR<{
    sessions: SessionListItem[]
    total: number
    page: number
    limit: number
    totalPages: number
  }>(key, fetcher, {
    refreshInterval: 15_000,
  })
}

export function useSessionDetail(sessionId: string | null) {
  return useSWR(
    sessionId ? `/api/sessions/${sessionId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )
}

export function useProjects() {
  return useSWR<{ projects: ProjectResponse[] }>("/api/projects", fetcher, {
    refreshInterval: 60_000,
  })
}

export function useActiveSessions() {
  return useSWR<{ sessions: ActiveSession[] }>("/api/active", fetcher, {
    refreshInterval: 5_000,
  })
}

export function useHistory(limit = 100) {
  return useSWR<{ entries: HistoryEntry[]; total: number }>(
    `/api/history?limit=${limit}`,
    fetcher,
    { refreshInterval: 10_000 }
  )
}
