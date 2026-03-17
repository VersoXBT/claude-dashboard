import os from "os"
import path from "path"
import fs from "fs"

export function getClaudeHome(): string {
  const envHome = process.env.CLAUDE_HOME
  if (envHome) {
    return envHome
  }
  return path.join(os.homedir(), ".claude")
}

export function claudeHomeExists(): boolean {
  try {
    return fs.existsSync(getClaudeHome())
  } catch {
    return false
  }
}

export function resolveClaudePath(...segments: string[]): string {
  return path.join(getClaudeHome(), ...segments)
}

export function decodeProjectDirName(dirName: string): string {
  return dirName.replace(/^-/, "/").replace(/-/g, "/")
}
