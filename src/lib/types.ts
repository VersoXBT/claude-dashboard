// ============================================================
// Core TypeScript interfaces for Claude Code data structures
// ============================================================

// --- Stats Cache (from ~/.claude/stats-cache.json) ---

export interface StatsCache {
  readonly version: number
  readonly lastComputedDate: string
  readonly dailyActivity: readonly DailyActivity[]
  readonly dailyModelTokens: readonly DailyModelTokens[]
  readonly modelUsage: Readonly<Record<string, ModelUsage>>
  readonly totalSessions: number
  readonly totalMessages: number
  readonly longestSession: LongestSession
  readonly firstSessionDate: string
  readonly hourCounts: Readonly<Record<string, number>>
  readonly totalSpeculationTimeSavedMs: number
}

export interface DailyActivity {
  readonly date: string
  readonly messageCount: number
  readonly sessionCount: number
  readonly toolCallCount: number
}

export interface DailyModelTokens {
  readonly date: string
  readonly tokensByModel: Readonly<Record<string, number>>
}

export interface ModelUsage {
  readonly inputTokens: number
  readonly outputTokens: number
  readonly cacheReadInputTokens: number
  readonly cacheCreationInputTokens: number
  readonly webSearchRequests: number
  readonly costUSD: number
  readonly contextWindow: number
  readonly maxOutputTokens: number
}

export interface LongestSession {
  readonly duration: number
  readonly messageCount: number
  readonly timestamp: string
}

// --- Session Index (from ~/.claude/projects/*/sessions-index.json) ---

export interface SessionIndex {
  readonly version: number
  readonly entries: readonly SessionIndexEntry[]
}

export interface SessionIndexEntry {
  readonly sessionId: string
  readonly fullPath: string
  readonly fileMtime: number
  readonly firstPrompt: string
  readonly summary: string
  readonly messageCount: number
  readonly created: string
  readonly modified: string
  readonly gitBranch: string
  readonly projectPath: string
  readonly isSidechain: boolean
}

// --- JSONL Message Types (from session *.jsonl files) ---

export interface BaseMessage {
  readonly type: string
  readonly uuid: string
  readonly parentUuid: string | null
  readonly sessionId: string
  readonly timestamp: string
  readonly cwd: string
  readonly version: string
  readonly gitBranch: string
  readonly slug: string
  readonly isSidechain: boolean
  readonly userType: string
}

export interface UserMessage extends BaseMessage {
  readonly type: "user"
  readonly message: {
    readonly role: "user"
    readonly content: string | readonly ContentBlock[]
  }
}

export interface AssistantMessage extends BaseMessage {
  readonly type: "assistant"
  readonly requestId: string
  readonly message: {
    readonly role: "assistant"
    readonly model: string
    readonly content: readonly ContentBlock[]
    readonly usage: TokenUsage
  }
}

export interface ProgressMessage extends BaseMessage {
  readonly type: "progress"
  readonly data: Readonly<Record<string, unknown>>
  readonly toolUseID: string
  readonly parentToolUseID: string
}

export type SessionMessage = UserMessage | AssistantMessage | ProgressMessage | BaseMessage

export interface ContentBlock {
  readonly type: string
  readonly text?: string
  readonly name?: string
  readonly id?: string
  readonly input?: unknown
}

export interface TokenUsage {
  readonly input_tokens: number
  readonly output_tokens: number
  readonly cache_creation_input_tokens: number
  readonly cache_read_input_tokens: number
  readonly service_tier?: string
  readonly inference_geo?: string
}

// --- History (from ~/.claude/history.jsonl) ---

export interface HistoryEntry {
  readonly display: string
  readonly pastedContents?: Readonly<Record<string, unknown>>
  readonly timestamp: number
  readonly project: string
  readonly sessionId: string
}

// --- Active Sessions (from ~/.claude/sessions/*.json) ---

export interface ActiveSessionFile {
  readonly pid: number
  readonly sessionId: string
  readonly cwd: string
  readonly startedAt: number
}

export interface ActiveSession extends ActiveSessionFile {
  readonly isRunning: boolean
  readonly projectName: string
  readonly durationMs: number
}

// --- Scanner Results ---

export interface ScanResult {
  readonly claudeHome: string
  readonly statsCachePath: string | null
  readonly historyPath: string | null
  readonly projects: readonly ProjectScanEntry[]
  readonly activeSessionFiles: readonly string[]
}

export interface ProjectScanEntry {
  readonly dirName: string
  readonly dirPath: string
  readonly sessionIndexPath: string | null
  readonly sessionIndexMtime: number | null
  readonly jsonlFiles: readonly JsonlFileEntry[]
}

export interface JsonlFileEntry {
  readonly sessionId: string
  readonly filePath: string
  readonly mtime: number
  readonly sizeBytes: number
}

// --- API Response Types ---

export interface StatsResponse {
  readonly dailyActivity: readonly DailyActivity[]
  readonly dailyModelTokens: readonly DailyModelTokens[]
  readonly modelUsage: Readonly<Record<string, ModelUsage>>
  readonly totalSessions: number
  readonly totalMessages: number
  readonly longestSession: LongestSession
  readonly firstSessionDate: string
  readonly hourCounts: Readonly<Record<string, number>>
  readonly estimatedCosts: CostBreakdown
}

export interface CostBreakdown {
  readonly totalCost: number
  readonly costByModel: Readonly<Record<string, number>>
  readonly costToday: number
  readonly costThisWeek: number
  readonly costThisMonth: number
  readonly projectedMonthly: number
}

export interface ProjectResponse {
  readonly id: string
  readonly name: string
  readonly path: string
  readonly sessionCount: number
  readonly totalMessages: number
  readonly lastActivity: string
  readonly estimatedCost: number
}

export interface SessionListItem {
  readonly sessionId: string
  readonly projectName: string
  readonly projectPath: string
  readonly summary: string
  readonly firstPrompt: string
  readonly messageCount: number
  readonly created: string
  readonly modified: string
  readonly gitBranch: string
  readonly estimatedCost: number
  readonly isActive: boolean
  readonly isSidechain: boolean
}

export interface SessionDetail {
  readonly sessionId: string
  readonly projectName: string
  readonly projectPath: string
  readonly gitBranch: string
  readonly created: string
  readonly modified: string
  readonly messages: readonly ParsedMessage[]
  readonly totalTokens: TokenSummary
  readonly estimatedCost: number
  readonly toolCalls: readonly ToolCallSummary[]
  readonly modelsUsed: readonly string[]
  readonly webSearchCount: number
}

export interface DashboardSettings {
  readonly claudeHome: string
  readonly totalProjects: number
  readonly totalSessionFiles: number
  readonly firstSessionDate: string
  readonly totalStorageBytes: number
  readonly version: string
}

export interface ParsedMessage {
  readonly uuid: string
  readonly role: "user" | "assistant" | "system" | "progress"
  readonly content: string
  readonly timestamp: string
  readonly model?: string
  readonly tokens?: TokenUsage
  readonly toolCalls?: readonly ToolCallInfo[]
}

export interface TokenSummary {
  readonly inputTokens: number
  readonly outputTokens: number
  readonly cacheReadTokens: number
  readonly cacheCreationTokens: number
  readonly totalTokens: number
}

export interface ToolCallSummary {
  readonly name: string
  readonly count: number
}

export interface ToolCallInfo {
  readonly id: string
  readonly name: string
  readonly input?: unknown
}

// --- Cost Configuration ---

export interface ModelPricing {
  readonly inputPerMTok: number
  readonly outputPerMTok: number
  readonly cacheReadPerMTok: number
  readonly cacheCreationPerMTok: number
}
