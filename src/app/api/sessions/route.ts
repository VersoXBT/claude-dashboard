import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { scanClaudeData } from "@/lib/scanner"
import { parseSessionIndex } from "@/lib/parser"
import { getActiveSessions } from "@/lib/active-sessions"
import { decodeProjectDirName } from "@/lib/claude-home"
import type { SessionListItem } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") ?? "1", 10)
    const limit = parseInt(searchParams.get("limit") ?? "50", 10)
    const projectFilter = searchParams.get("project")
    const search = searchParams.get("search")?.toLowerCase()
    const sort = searchParams.get("sort") ?? "modified"
    const order = searchParams.get("order") ?? "desc"

    const scan = await scanClaudeData()
    const activeSessions = await getActiveSessions(scan.activeSessionFiles)
    const activeSessionIds = new Set(activeSessions.map((s) => s.sessionId))

    const allSessions: SessionListItem[] = []

    for (const project of scan.projects) {
      const projectName = decodeProjectDirName(project.dirName)

      if (projectFilter && !projectName.toLowerCase().includes(projectFilter.toLowerCase())) {
        continue
      }

      if (project.sessionIndexPath) {
        const entries = await parseSessionIndex(project.sessionIndexPath)
        for (const entry of entries) {
          if (search) {
            const matchesSearch =
              entry.summary?.toLowerCase().includes(search) ||
              entry.firstPrompt?.toLowerCase().includes(search) ||
              entry.sessionId.toLowerCase().includes(search)
            if (!matchesSearch) continue
          }

          allSessions.push({
            sessionId: entry.sessionId,
            projectName,
            projectPath: entry.projectPath,
            summary: entry.summary ?? "",
            firstPrompt: entry.firstPrompt ?? "",
            messageCount: entry.messageCount,
            created: entry.created,
            modified: entry.modified,
            gitBranch: entry.gitBranch ?? "",
            estimatedCost: 0,
            isActive: activeSessionIds.has(entry.sessionId),
            isSidechain: entry.isSidechain ?? false,
          })
        }
      } else {
        for (const jsonl of project.jsonlFiles) {
          allSessions.push({
            sessionId: jsonl.sessionId,
            projectName,
            projectPath: projectName,
            summary: "",
            firstPrompt: "",
            messageCount: 0,
            created: new Date(jsonl.mtime).toISOString(),
            modified: new Date(jsonl.mtime).toISOString(),
            gitBranch: "",
            estimatedCost: 0,
            isActive: activeSessionIds.has(jsonl.sessionId),
            isSidechain: false,
          })
        }
      }
    }

    allSessions.sort((a, b) => {
      const aVal = sort === "modified" ? a.modified : sort === "created" ? a.created : a.modified
      const bVal = sort === "modified" ? b.modified : sort === "created" ? b.created : b.modified
      return order === "desc" ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal)
    })

    const offset = (page - 1) * limit
    const paginated = allSessions.slice(offset, offset + limit)

    return NextResponse.json({
      sessions: paginated,
      total: allSessions.length,
      page,
      limit,
      totalPages: Math.ceil(allSessions.length / limit),
    })
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to load sessions: ${error}` },
      { status: 500 }
    )
  }
}
