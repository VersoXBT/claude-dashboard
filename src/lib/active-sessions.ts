import { parseActiveSessionFiles } from "./parser"
import { activeSessionCache } from "./cache"
import { decodeProjectDirName } from "./claude-home"
import type { ActiveSession, ActiveSessionFile } from "./types"

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

export async function getActiveSessions(
  sessionFilePaths: readonly string[]
): Promise<ActiveSession[]> {
  const cached = activeSessionCache.get<ActiveSession[]>("active-sessions")
  if (cached) return cached

  const rawSessions = await parseActiveSessionFiles(sessionFilePaths)
  const now = Date.now()

  const sessions: ActiveSession[] = rawSessions
    .filter((s: ActiveSessionFile) => isProcessRunning(s.pid))
    .map((s: ActiveSessionFile) => {
      const parts = s.cwd.split("/")
      const projectName = parts[parts.length - 1] ?? decodeProjectDirName(s.cwd)

      return {
        ...s,
        isRunning: true,
        projectName,
        durationMs: now - s.startedAt,
      }
    })

  activeSessionCache.set("active-sessions", sessions)
  return sessions
}
