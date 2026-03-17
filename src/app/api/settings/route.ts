import { NextResponse } from "next/server"
import { scanClaudeData } from "@/lib/scanner"
import { parseStatsCache } from "@/lib/parser"
import type { DashboardSettings } from "@/lib/types"

export async function GET() {
  try {
    const scan = await scanClaudeData()

    const totalProjects = scan.projects.length
    const totalSessionFiles = scan.projects.reduce(
      (sum, p) => sum + p.jsonlFiles.length,
      0
    )
    const totalStorageBytes = scan.projects.reduce(
      (sum, p) => sum + p.jsonlFiles.reduce((s, f) => s + f.sizeBytes, 0),
      0
    )

    let firstSessionDate = ""
    if (scan.statsCachePath) {
      try {
        const stats = await parseStatsCache(scan.statsCachePath)
        firstSessionDate = stats.firstSessionDate ?? ""
      } catch {
        // Ignore
      }
    }

    const settings: DashboardSettings = {
      claudeHome: scan.claudeHome,
      totalProjects,
      totalSessionFiles,
      firstSessionDate,
      totalStorageBytes,
      version: "0.1.0",
    }

    return NextResponse.json(settings)
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to load settings: ${error}` },
      { status: 500 }
    )
  }
}
