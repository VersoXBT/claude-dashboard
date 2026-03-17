import { NextResponse } from "next/server"
import { scanClaudeData } from "@/lib/scanner"
import { parseStatsCache } from "@/lib/parser"
import { calculateCostBreakdown } from "@/lib/costs"
import type { StatsResponse } from "@/lib/types"

export async function GET() {
  try {
    const scan = await scanClaudeData()

    if (!scan.statsCachePath) {
      return NextResponse.json(
        { error: "No stats-cache.json found in ~/.claude/" },
        { status: 404 }
      )
    }

    const stats = await parseStatsCache(scan.statsCachePath)
    const estimatedCosts = calculateCostBreakdown(
      stats.modelUsage as Record<string, (typeof stats.modelUsage)[string]>,
      stats.dailyModelTokens
    )

    const response: StatsResponse = {
      dailyActivity: stats.dailyActivity,
      dailyModelTokens: stats.dailyModelTokens,
      modelUsage: stats.modelUsage,
      totalSessions: stats.totalSessions,
      totalMessages: stats.totalMessages,
      longestSession: stats.longestSession,
      firstSessionDate: stats.firstSessionDate,
      hourCounts: stats.hourCounts,
      estimatedCosts,
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to load stats: ${error}` },
      { status: 500 }
    )
  }
}
