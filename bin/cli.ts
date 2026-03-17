#!/usr/bin/env node

import { execSync } from "child_process"
import { existsSync } from "fs"
import { join } from "path"
import { homedir } from "os"

const claudeHome = join(homedir(), ".claude")

if (!existsSync(claudeHome)) {
  console.error("Error: ~/.claude/ directory not found.")
  console.error("Make sure you have Claude Code installed and have used it at least once.")
  process.exit(1)
}

const port = process.argv.includes("--port")
  ? process.argv[process.argv.indexOf("--port") + 1]
  : "3000"

console.log(`Starting Claude Dashboard on http://localhost:${port}`)
console.log("Reading data from:", claudeHome)

try {
  execSync(`npx next start -p ${port}`, {
    stdio: "inherit",
    env: { ...process.env, CLAUDE_HOME: claudeHome },
  })
} catch {
  process.exit(1)
}
