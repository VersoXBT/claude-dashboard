import fs from "fs"
import path from "path"
import { getClaudeHome } from "./claude-home"
import type { ScanResult, ProjectScanEntry, JsonlFileEntry } from "./types"
import { dataCache } from "./cache"

export async function scanClaudeData(): Promise<ScanResult> {
  const cached = dataCache.get<ScanResult>("scan-result")
  if (cached) return cached

  const claudeHome = getClaudeHome()

  const [statsCachePath, historyPath, projects, activeSessionFiles] = await Promise.all([
    findFile(claudeHome, "stats-cache.json"),
    findFile(claudeHome, "history.jsonl"),
    scanProjects(path.join(claudeHome, "projects")),
    scanActiveSessionFiles(path.join(claudeHome, "sessions")),
  ])

  const result: ScanResult = {
    claudeHome,
    statsCachePath,
    historyPath,
    projects,
    activeSessionFiles,
  }

  dataCache.set("scan-result", result)
  return result
}

async function findFile(dir: string, filename: string): Promise<string | null> {
  const filePath = path.join(dir, filename)
  try {
    await fs.promises.access(filePath, fs.constants.R_OK)
    return filePath
  } catch {
    return null
  }
}

async function scanProjects(projectsDir: string): Promise<ProjectScanEntry[]> {
  try {
    const entries = await fs.promises.readdir(projectsDir, { withFileTypes: true })
    const projectDirs = entries.filter((e) => e.isDirectory())

    const projects = await Promise.all(
      projectDirs.map(async (entry) => {
        const dirPath = path.join(projectsDir, entry.name)
        return scanSingleProject(entry.name, dirPath)
      })
    )

    return projects
  } catch {
    return []
  }
}

async function scanSingleProject(
  dirName: string,
  dirPath: string
): Promise<ProjectScanEntry> {
  const indexPath = path.join(dirPath, "sessions-index.json")
  let sessionIndexPath: string | null = null
  let sessionIndexMtime: number | null = null

  try {
    const stat = await fs.promises.stat(indexPath)
    sessionIndexPath = indexPath
    sessionIndexMtime = stat.mtimeMs
  } catch {
    // No sessions-index.json
  }

  const jsonlFiles = await scanJsonlFiles(dirPath)

  return {
    dirName,
    dirPath,
    sessionIndexPath,
    sessionIndexMtime,
    jsonlFiles,
  }
}

async function scanJsonlFiles(dirPath: string): Promise<JsonlFileEntry[]> {
  try {
    const entries = await fs.promises.readdir(dirPath)
    const jsonlEntries = entries.filter((e) => e.endsWith(".jsonl"))

    const files = await Promise.all(
      jsonlEntries.map(async (filename) => {
        const filePath = path.join(dirPath, filename)
        try {
          const stat = await fs.promises.stat(filePath)
          return {
            sessionId: filename.replace(".jsonl", ""),
            filePath,
            mtime: stat.mtimeMs,
            sizeBytes: stat.size,
          }
        } catch {
          return null
        }
      })
    )

    return files.filter((f): f is JsonlFileEntry => f !== null)
  } catch {
    return []
  }
}

async function scanActiveSessionFiles(sessionsDir: string): Promise<string[]> {
  try {
    const entries = await fs.promises.readdir(sessionsDir)
    return entries
      .filter((e) => e.endsWith(".json") && e !== "compaction-log.txt")
      .map((e) => path.join(sessionsDir, e))
  } catch {
    return []
  }
}
