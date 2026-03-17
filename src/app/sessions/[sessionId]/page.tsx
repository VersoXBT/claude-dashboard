"use client"

import { useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSessionDetail } from "@/hooks/use-dashboard-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ArrowLeft,
  MessageSquare,
  Zap,
  DollarSign,
  Clock,
  ChevronDown,
  ChevronRight,
  Wrench,
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts"
import type { SessionDetail, ParsedMessage } from "@/lib/types"

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function formatDuration(created: string, modified: string): string {
  const start = new Date(created).getTime()
  const end = new Date(modified).getTime()
  const diffMs = Math.max(0, end - start)
  const seconds = Math.floor(diffMs / 1_000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

function estimateCost(tokens: SessionDetail["totalTokens"]): number {
  const inputRate = 3.0 / 1_000_000
  const outputRate = 15.0 / 1_000_000
  const cacheReadRate = 0.3 / 1_000_000
  const cacheCreateRate = 3.75 / 1_000_000
  return (
    tokens.inputTokens * inputRate +
    tokens.outputTokens * outputRate +
    tokens.cacheReadTokens * cacheReadRate +
    tokens.cacheCreationTokens * cacheCreateRate
  )
}

export default function SessionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  const { data: session, isLoading } = useSessionDetail(sessionId)

  if (isLoading) {
    return <SessionDetailSkeleton />
  }

  if (!session) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/sessions")}
          className="text-[#B8AFA5] hover:text-[#D4714E] hover:bg-[#2D2822]"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to sessions
        </Button>
        <div className="text-center py-16 text-[#7A7267]">
          <p className="text-lg font-medium">Session not found</p>
        </div>
      </div>
    )
  }

  const cost = session.estimatedCost ?? estimateCost(session.totalTokens)
  const duration = formatDuration(session.created, session.modified)

  return (
    <div className="space-y-6">
      <SessionHeader session={session} onBack={() => router.push("/sessions")} />
      <KPICards session={session} cost={cost} duration={duration} />
      <TokenWaterfall messages={session.messages} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ConversationTimeline messages={session.messages} />
        </div>
        <div>
          <ToolUsageSummary toolCalls={session.toolCalls} />
        </div>
      </div>
    </div>
  )
}

function SessionHeader({
  session,
  onBack,
}: {
  readonly session: SessionDetail
  readonly onBack: () => void
}) {
  const firstUserMessage = session.messages.find((m) => m.role === "user")
  const summary = firstUserMessage
    ? firstUserMessage.content.slice(0, 120)
    : "Session"

  return (
    <div className="space-y-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="text-[#B8AFA5] hover:text-[#D4714E] hover:bg-[#2D2822]"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to sessions
      </Button>
      <div>
        <h1 className="text-xl font-semibold text-[#F5F0EB]">
          {summary}
          {summary.length >= 120 ? "..." : ""}
        </h1>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge className="bg-[#D4A04E]/15 text-[#D4A04E] border-[#D4A04E]/30">
            {session.projectName}
          </Badge>
          {session.gitBranch && (
            <Badge variant="outline" className="font-mono text-xs border-[#3D3830] text-[#B8AFA5]">
              {session.gitBranch}
            </Badge>
          )}
          <span className="text-xs text-[#7A7267]">
            {format(new Date(session.created), "MMM d, yyyy 'at' h:mm a")}
          </span>
          <span className="text-xs text-[#7A7267]">
            {formatDistanceToNow(new Date(session.created), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>
    </div>
  )
}

function KPICards({
  session,
  cost,
  duration,
}: {
  readonly session: SessionDetail
  readonly cost: number
  readonly duration: string
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-[#231F1B]/50 border-[#3D3830]">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4 text-[#D4714E]" />
            <span className="text-xs font-medium text-[#B8AFA5] uppercase tracking-wider">
              Messages
            </span>
          </div>
          <div className="text-2xl font-bold text-[#F5F0EB]">
            {session.messages.length}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#231F1B]/50 border-[#3D3830]">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-[#D4A04E]" />
            <span className="text-xs font-medium text-[#B8AFA5] uppercase tracking-wider">
              Total Tokens
            </span>
          </div>
          <div className="text-2xl font-bold text-[#F5F0EB]">
            {formatNumber(session.totalTokens.totalTokens)}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#231F1B]/50 border-[#3D3830]">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-[#6EAE7E]" />
            <span className="text-xs font-medium text-[#B8AFA5] uppercase tracking-wider">
              Est. Cost
            </span>
          </div>
          <div className="text-2xl font-bold text-[#F5F0EB]">
            ${cost.toFixed(2)}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#231F1B]/50 border-[#3D3830]">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-[#5BA3A8]" />
            <span className="text-xs font-medium text-[#B8AFA5] uppercase tracking-wider">
              Duration
            </span>
          </div>
          <div className="text-2xl font-bold text-[#F5F0EB]">{duration}</div>
        </CardContent>
      </Card>
    </div>
  )
}

function TokenWaterfall({
  messages,
}: {
  readonly messages: readonly ParsedMessage[]
}) {
  const chartData = useMemo(() => {
    return messages
      .filter((m) => m.role === "assistant" && m.tokens)
      .map((m, i) => ({
        index: i + 1,
        input: m.tokens?.input_tokens ?? 0,
        output: m.tokens?.output_tokens ?? 0,
        cache:
          (m.tokens?.cache_read_input_tokens ?? 0) +
          (m.tokens?.cache_creation_input_tokens ?? 0),
      }))
  }, [messages])

  if (chartData.length === 0) return null

  return (
    <Card className="bg-[#231F1B]/50 border-[#3D3830]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-[#F5F0EB]">
          Token Waterfall
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#3D3830" />
            <XAxis
              dataKey="index"
              tick={{ fill: "#7A7267", fontSize: 12 }}
              stroke="#3D3830"
              label={{
                value: "Message #",
                position: "insideBottom",
                offset: -2,
                fill: "#7A7267",
                fontSize: 12,
              }}
            />
            <YAxis
              tick={{ fill: "#7A7267", fontSize: 12 }}
              stroke="#3D3830"
              tickFormatter={(v: number) => formatNumber(v)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#2D2822",
                border: "1px solid #3D3830",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#B8AFA5" }}
              formatter={(value) => [
                formatNumber(Number(value)),
                "",
              ]}
              labelFormatter={(label) => `Message #${label}`}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", color: "#B8AFA5" }}
              formatter={(value: string) =>
                value === "input"
                  ? "Input"
                  : value === "output"
                    ? "Output"
                    : "Cache"
              }
            />
            <Bar
              dataKey="input"
              stackId="tokens"
              fill="#5BA3A8"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="output"
              stackId="tokens"
              fill="#D4714E"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="cache"
              stackId="tokens"
              fill="#D4A04E"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function ConversationTimeline({
  messages,
}: {
  readonly messages: readonly ParsedMessage[]
}) {
  return (
    <Card className="bg-[#231F1B]/50 border-[#3D3830]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-[#F5F0EB]">
          Conversation Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px] px-4 pb-4">
          <div className="space-y-2 pt-2">
            {messages.map((message) => (
              <MessageBubble key={message.uuid} message={message} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function MessageBubble({
  message,
}: {
  readonly message: ParsedMessage
}) {
  const [toolsExpanded, setToolsExpanded] = useState(false)

  if (message.role === "user") {
    return (
      <div className="rounded-lg bg-[#231F1B] border-l-2 border-[#D4714E] border-r border-t border-b border-r-[#3D3830] border-t-[#3D3830] border-b-[#3D3830] p-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-[#D4714E]">User</span>
          <span className="text-xs text-[#564F47]">
            {format(new Date(message.timestamp), "h:mm:ss a")}
          </span>
        </div>
        <p className="text-sm text-[#F5F0EB] line-clamp-4 whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    )
  }

  if (message.role === "assistant") {
    const tokenCount = message.tokens
      ? (message.tokens.input_tokens ?? 0) +
        (message.tokens.output_tokens ?? 0)
      : 0

    return (
      <div className="space-y-1">
        <div className="rounded-lg bg-[#231F1B] border-l-2 border-[#5BA3A8] border-r border-t border-b border-r-[#3D3830] border-t-[#3D3830] border-b-[#3D3830] p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-[#5BA3A8]">
              Assistant
            </span>
            <span className="text-xs text-[#564F47]">
              {format(new Date(message.timestamp), "h:mm:ss a")}
            </span>
            {tokenCount > 0 && (
              <Badge className="text-[10px] h-4 px-1.5 bg-[#D4714E]/15 text-[#D4714E] border-[#D4714E]/30">
                {formatNumber(tokenCount)} tokens
              </Badge>
            )}
            {message.model && (
              <span className="text-[10px] text-[#564F47]">{message.model}</span>
            )}
          </div>
          <p className="text-sm text-[#F5F0EB] line-clamp-4 whitespace-pre-wrap">
            {message.content}
          </p>
        </div>

        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="rounded-lg bg-[#2D2822] border border-[#3D3830] p-2">
            <button
              onClick={() => setToolsExpanded((prev) => !prev)}
              className="flex items-center gap-1.5 w-full text-left"
            >
              {toolsExpanded ? (
                <ChevronDown className="h-3 w-3 text-[#7A7267]" />
              ) : (
                <ChevronRight className="h-3 w-3 text-[#7A7267]" />
              )}
              <Wrench className="h-3 w-3 text-[#7A7267]" />
              <span className="text-xs text-[#B8AFA5]">
                {message.toolCalls.length} tool call
                {message.toolCalls.length !== 1 ? "s" : ""}
              </span>
              <div className="flex gap-1 ml-1 flex-wrap">
                {message.toolCalls.map((tc) => (
                  <Badge
                    key={tc.id}
                    variant="outline"
                    className="text-[10px] h-4 px-1.5 font-mono border-[#3D3830] text-[#B8AFA5]"
                  >
                    {tc.name}
                  </Badge>
                ))}
              </div>
            </button>
            {toolsExpanded && (
              <div className="mt-2 space-y-1 pl-5">
                {message.toolCalls.map((tc) => (
                  <div key={tc.id} className="text-xs text-[#7A7267] font-mono">
                    {tc.name}
                    {tc.input ? (
                      <span className="text-[#564F47] ml-1">
                        ({JSON.stringify(tc.input).slice(0, 80)}
                        {JSON.stringify(tc.input).length > 80 ? "..." : ""})
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-[#2D2822]/50 border border-[#3D3830]/50 p-2">
      <span className="text-xs text-[#7A7267]">
        {message.role} - {format(new Date(message.timestamp), "h:mm:ss a")}
      </span>
    </div>
  )
}

function ToolUsageSummary({
  toolCalls,
}: {
  readonly toolCalls: readonly { name: string; count: number }[]
}) {
  const sortedTools = useMemo(
    () => [...toolCalls].sort((a, b) => b.count - a.count),
    [toolCalls]
  )

  if (sortedTools.length === 0) return null

  return (
    <Card className="bg-[#231F1B]/50 border-[#3D3830]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-[#F5F0EB]">
          Tool Usage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(200, sortedTools.length * 32)}>
          <BarChart
            data={sortedTools}
            layout="vertical"
            margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#3D3830"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fill: "#7A7267", fontSize: 12 }}
              stroke="#3D3830"
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "#B8AFA5", fontSize: 11 }}
              stroke="#3D3830"
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#2D2822",
                border: "1px solid #3D3830",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value) => [Number(value), "Calls"]}
            />
            <Bar dataKey="count" fill="#D4714E" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function SessionDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-8 w-32 bg-[#2D2822]" />
        <Skeleton className="h-6 w-96 bg-[#2D2822]" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 bg-[#2D2822]" />
          <Skeleton className="h-5 w-32 bg-[#2D2822]" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px] rounded-lg bg-[#2D2822]" />
        ))}
      </div>
      <Skeleton className="h-[280px] rounded-lg bg-[#2D2822]" />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Skeleton className="xl:col-span-2 h-[500px] rounded-lg bg-[#2D2822]" />
        <Skeleton className="h-[300px] rounded-lg bg-[#2D2822]" />
      </div>
    </div>
  )
}
