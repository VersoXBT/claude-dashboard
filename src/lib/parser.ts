import fs from "fs"
import readline from "readline"
import type {
  StatsCache,
  SessionIndex,
  SessionIndexEntry,
  HistoryEntry,
  ActiveSessionFile,
  SessionMessage,
  AssistantMessage,
  UserMessage,
  ParsedMessage,
  TokenUsage,
  TokenSummary,
  ToolCallInfo,
  SessionDetail,
  ToolCallSummary,
} from "./types"
import { dataCache } from "./cache"
import { calculateModelCost } from "./costs"

export async function parseStatsCache(filePath: string): Promise<StatsCache> {
  try {
    const stat = await fs.promises.stat(filePath)
    const cached = dataCache.get<StatsCache>("stats-cache", stat.mtimeMs)
    if (cached) return cached

    const content = await fs.promises.readFile(filePath, "utf-8")
    const data = JSON.parse(content) as StatsCache
    dataCache.set("stats-cache", data, stat.mtimeMs)
    return data
  } catch (error) {
    throw new Error(`Failed to parse stats cache: ${error}`)
  }
}

export async function parseSessionIndex(filePath: string): Promise<SessionIndexEntry[]> {
  try {
    const stat = await fs.promises.stat(filePath)
    const cacheKey = `session-index:${filePath}`
    const cached = dataCache.get<SessionIndexEntry[]>(cacheKey, stat.mtimeMs)
    if (cached) return cached

    const content = await fs.promises.readFile(filePath, "utf-8")
    const data = JSON.parse(content) as SessionIndex
    const entries = [...(data.entries ?? [])]
    dataCache.set(cacheKey, entries, stat.mtimeMs)
    return entries
  } catch {
    return []
  }
}

export async function parseHistory(filePath: string): Promise<HistoryEntry[]> {
  try {
    const stat = await fs.promises.stat(filePath)
    const cached = dataCache.get<HistoryEntry[]>("history", stat.mtimeMs)
    if (cached) return cached

    const content = await fs.promises.readFile(filePath, "utf-8")
    const entries = content
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as HistoryEntry
        } catch {
          return null
        }
      })
      .filter((e): e is HistoryEntry => e !== null)

    dataCache.set("history", entries, stat.mtimeMs)
    return entries
  } catch {
    return []
  }
}

export async function parseActiveSessionFiles(
  filePaths: readonly string[]
): Promise<ActiveSessionFile[]> {
  const sessions = await Promise.all(
    filePaths.map(async (filePath) => {
      try {
        const content = await fs.promises.readFile(filePath, "utf-8")
        return JSON.parse(content) as ActiveSessionFile
      } catch {
        return null
      }
    })
  )
  return sessions.filter((s): s is ActiveSessionFile => s !== null)
}

export async function parseSessionDetail(
  filePath: string,
  projectName: string
): Promise<SessionDetail> {
  const messages: ParsedMessage[] = []
  const toolCallCounts: Record<string, number> = {}
  let totalInput = 0
  let totalOutput = 0
  let totalCacheRead = 0
  let totalCacheCreation = 0
  let estimatedCost = 0
  let sessionId = ""
  let gitBranch = ""
  let created = ""
  let modified = ""
  let projectPath = ""

  const stream = fs.createReadStream(filePath, { encoding: "utf-8" })
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity })

  for await (const line of rl) {
    if (!line.trim()) continue

    try {
      const msg = JSON.parse(line) as SessionMessage

      if (!sessionId && msg.sessionId) sessionId = msg.sessionId
      if (!gitBranch && msg.gitBranch) gitBranch = msg.gitBranch
      if (msg.cwd) projectPath = msg.cwd

      const timestamp = msg.timestamp ?? ""
      if (!created || timestamp < created) created = timestamp
      if (!modified || timestamp > modified) modified = timestamp

      if (msg.type === "user") {
        const userMsg = msg as UserMessage
        const content = typeof userMsg.message?.content === "string"
          ? userMsg.message.content
          : Array.isArray(userMsg.message?.content)
            ? userMsg.message.content
                .filter((b) => b.type === "text")
                .map((b) => b.text ?? "")
                .join("\n")
            : ""

        messages.push({
          uuid: msg.uuid,
          role: "user",
          content,
          timestamp,
        })
      } else if (msg.type === "assistant") {
        const assistantMsg = msg as AssistantMessage
        const usage = assistantMsg.message?.usage
        const model = assistantMsg.message?.model ?? ""

        const content = (assistantMsg.message?.content ?? [])
          .filter((b) => b.type === "text")
          .map((b) => b.text ?? "")
          .join("\n")

        const toolCalls: ToolCallInfo[] = (assistantMsg.message?.content ?? [])
          .filter((b) => b.type === "tool_use")
          .map((b) => {
            const name = b.name ?? "unknown"
            toolCallCounts[name] = (toolCallCounts[name] ?? 0) + 1
            return { id: b.id ?? "", name, input: b.input }
          })

        let tokens: TokenUsage | undefined
        if (usage) {
          tokens = {
            input_tokens: usage.input_tokens ?? 0,
            output_tokens: usage.output_tokens ?? 0,
            cache_creation_input_tokens: usage.cache_creation_input_tokens ?? 0,
            cache_read_input_tokens: usage.cache_read_input_tokens ?? 0,
          }
          totalInput += tokens.input_tokens
          totalOutput += tokens.output_tokens
          totalCacheRead += tokens.cache_read_input_tokens
          totalCacheCreation += tokens.cache_creation_input_tokens

          estimatedCost += calculateModelCost(
            {
              inputTokens: tokens.input_tokens,
              outputTokens: tokens.output_tokens,
              cacheReadInputTokens: tokens.cache_read_input_tokens,
              cacheCreationInputTokens: tokens.cache_creation_input_tokens,
              webSearchRequests: 0,
              costUSD: 0,
              contextWindow: 0,
              maxOutputTokens: 0,
            },
            model
          )
        }

        messages.push({
          uuid: msg.uuid,
          role: "assistant",
          content,
          timestamp,
          model,
          tokens,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        })
      }
    } catch {
      // Skip malformed lines
    }
  }

  const totalTokens: TokenSummary = {
    inputTokens: totalInput,
    outputTokens: totalOutput,
    cacheReadTokens: totalCacheRead,
    cacheCreationTokens: totalCacheCreation,
    totalTokens: totalInput + totalOutput + totalCacheRead + totalCacheCreation,
  }

  const toolCalls: ToolCallSummary[] = Object.entries(toolCallCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  return {
    sessionId,
    projectName,
    projectPath,
    gitBranch,
    created,
    modified,
    messages,
    totalTokens,
    estimatedCost,
    toolCalls,
  }
}
