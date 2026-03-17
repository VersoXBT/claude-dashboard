import { NextResponse } from "next/server"
import { scanClaudeData } from "@/lib/scanner"
import { parseSessionIndex, parseStatsCache } from "@/lib/parser"
import { calculateCostBreakdown } from "@/lib/costs"
import { decodeProjectDirName } from "@/lib/claude-home"
import type { ProjectResponse } from "@/lib/types"

export async function GET() {
  try {
    const scan = await scanClaudeData()
    const projects: ProjectResponse[] = []

    // Calculate average cost per message from stats cache
    let avgCostPerMessage = 0
    if (scan.statsCachePath) {
      try {
        const stats = await parseStatsCache(scan.statsCachePath)
        const costBreakdown = calculateCostBreakdown(
          stats.modelUsage as Record<string, (typeof stats.modelUsage)[string]>,
          stats.dailyModelTokens
        )
        avgCostPerMessage = stats.totalMessages > 0
          ? costBreakdown.totalCost / stats.totalMessages
          : 0
      } catch {
        // Fall back to 0
      }
    }

    for (const project of scan.projects) {
      const name = decodeProjectDirName(project.dirName)
      let sessionCount = project.jsonlFiles.length
      let totalMessages = 0
      let lastActivity = ""

      if (project.sessionIndexPath) {
        const entries = await parseSessionIndex(project.sessionIndexPath)
        sessionCount = entries.length || sessionCount
        totalMessages = entries.reduce((sum, e) => sum + (e.messageCount ?? 0), 0)
        lastActivity = entries.reduce(
          (latest, e) => (e.modified > latest ? e.modified : latest),
          ""
        )
      }

      if (!lastActivity && project.jsonlFiles.length > 0) {
        const latestFile = project.jsonlFiles.reduce((latest, f) =>
          f.mtime > latest.mtime ? f : latest
        )
        lastActivity = new Date(latestFile.mtime).toISOString()
      }

      projects.push({
        id: project.dirName,
        name,
        path: name,
        sessionCount,
        totalMessages,
        lastActivity,
        estimatedCost: totalMessages * avgCostPerMessage,
      })
    }

    projects.sort((a, b) => b.lastActivity.localeCompare(a.lastActivity))

    return NextResponse.json({ projects })
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to load projects: ${error}` },
      { status: 500 }
    )
  }
}
