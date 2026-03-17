import { NextResponse } from "next/server"
import { scanClaudeData } from "@/lib/scanner"
import { parseSessionDetail } from "@/lib/parser"
import { decodeProjectDirName } from "@/lib/claude-home"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params

    const scan = await scanClaudeData()

    for (const project of scan.projects) {
      const match = project.jsonlFiles.find((f) => f.sessionId === sessionId)
      if (match) {
        const projectName = decodeProjectDirName(project.dirName)
        const detail = await parseSessionDetail(match.filePath, projectName)
        return NextResponse.json(detail)
      }
    }

    return NextResponse.json(
      { error: `Session ${sessionId} not found` },
      { status: 404 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to load session: ${error}` },
      { status: 500 }
    )
  }
}
