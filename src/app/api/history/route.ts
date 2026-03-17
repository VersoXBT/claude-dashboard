import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { scanClaudeData } from "@/lib/scanner"
import { parseHistory } from "@/lib/parser"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") ?? "100", 10)
    const offset = parseInt(searchParams.get("offset") ?? "0", 10)

    const scan = await scanClaudeData()

    if (!scan.historyPath) {
      return NextResponse.json({ entries: [], total: 0 })
    }

    const allEntries = await parseHistory(scan.historyPath)
    const sorted = [...allEntries].sort((a, b) => b.timestamp - a.timestamp)
    const paginated = sorted.slice(offset, offset + limit)

    return NextResponse.json({
      entries: paginated,
      total: allEntries.length,
    })
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to load history: ${error}` },
      { status: 500 }
    )
  }
}
