import { NextResponse } from "next/server"
import { scanClaudeData } from "@/lib/scanner"
import { parseSessionIndex } from "@/lib/parser"
import { decodeProjectDirName } from "@/lib/claude-home"
import type { ProjectResponse } from "@/lib/types"

export async function GET() {
  try {
    const scan = await scanClaudeData()
    const projects: ProjectResponse[] = []

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
        estimatedCost: 0,
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
