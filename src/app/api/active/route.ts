import { NextResponse } from "next/server"
import { scanClaudeData } from "@/lib/scanner"
import { getActiveSessions } from "@/lib/active-sessions"

export async function GET() {
  try {
    const scan = await scanClaudeData()
    const sessions = await getActiveSessions(scan.activeSessionFiles)

    return NextResponse.json({ sessions })
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to load active sessions: ${error}` },
      { status: 500 }
    )
  }
}
