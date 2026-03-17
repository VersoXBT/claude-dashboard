"use client"

import { useMemo, useState } from "react"
import { ChartContainer } from "@/components/charts/chart-container"
import type { DailyActivity } from "@/lib/types"

interface ActivityHeatmapProps {
  readonly dailyActivity: readonly DailyActivity[]
}

interface DayCell {
  readonly date: string
  readonly tokens: number
  readonly messages: number
  readonly sessions: number
  readonly toolCalls: number
  readonly level: number
}

function getLevel(value: number, max: number): number {
  if (value === 0) return 0
  if (max === 0) return 0
  const ratio = value / max
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

const LEVEL_CLASSES = [
  "bg-zinc-800",
  "bg-emerald-900/40",
  "bg-emerald-700/50",
  "bg-emerald-500/60",
  "bg-emerald-400/80",
] as const

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""] as const

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function ActivityHeatmap({ dailyActivity }: ActivityHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<DayCell | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const { weeks, monthLabels } = useMemo(() => {
    const activityMap = new Map<string, DailyActivity>()
    for (const day of dailyActivity) {
      activityMap.set(day.date, day)
    }

    const today = new Date()
    const endDate = new Date(today)
    endDate.setHours(0, 0, 0, 0)

    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - 364)

    const dayOfWeek = startDate.getDay()
    startDate.setDate(startDate.getDate() - dayOfWeek)

    const maxMessages = dailyActivity.reduce(
      (max, d) => Math.max(max, d.messageCount),
      0
    )

    const weeksArr: DayCell[][] = []
    const months: { label: string; weekIndex: number }[] = []
    let currentWeek: DayCell[] = []
    let lastMonth = -1
    let weekIndex = 0

    const cursor = new Date(startDate)
    while (cursor <= endDate) {
      const dateStr = cursor.toISOString().split("T")[0]
      const activity = activityMap.get(dateStr)
      const messages = activity?.messageCount ?? 0

      currentWeek.push({
        date: dateStr,
        tokens: messages,
        messages,
        sessions: activity?.sessionCount ?? 0,
        toolCalls: activity?.toolCallCount ?? 0,
        level: getLevel(messages, maxMessages),
      })

      const month = cursor.getMonth()
      if (month !== lastMonth) {
        months.push({
          label: cursor.toLocaleDateString("en-US", { month: "short" }),
          weekIndex,
        })
        lastMonth = month
      }

      if (currentWeek.length === 7) {
        weeksArr.push(currentWeek)
        currentWeek = []
        weekIndex++
      }

      cursor.setDate(cursor.getDate() + 1)
    }

    if (currentWeek.length > 0) {
      weeksArr.push(currentWeek)
    }

    return { weeks: weeksArr, monthLabels: months }
  }, [dailyActivity])

  return (
    <ChartContainer
      title="Activity Heatmap"
      subtitle="365 days of coding activity"
      height="h-[180px]"
      isEmpty={dailyActivity.length === 0}
    >
      <div className="relative flex flex-col gap-1 h-full overflow-x-auto">
        <div className="flex gap-[3px] ml-8 text-[10px] text-zinc-500 mb-1">
          {monthLabels.map((m, i) => (
            <span
              key={`${m.label}-${i}`}
              style={{
                position: "absolute",
                left: `${m.weekIndex * 15 + 32}px`,
              }}
            >
              {m.label}
            </span>
          ))}
        </div>

        <div className="flex gap-[3px] mt-4">
          <div className="flex flex-col gap-[3px] text-[10px] text-zinc-500 mr-1 shrink-0">
            {DAY_LABELS.map((label, i) => (
              <div key={i} className="h-[12px] flex items-center justify-end w-6">
                {label}
              </div>
            ))}
          </div>

          <div className="flex gap-[3px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day) => (
                  <div
                    key={day.date}
                    className={`w-[12px] h-[12px] rounded-[2px] ${LEVEL_CLASSES[day.level]} cursor-pointer transition-all hover:ring-1 hover:ring-zinc-400`}
                    onMouseEnter={(e) => {
                      setHoveredCell(day)
                      const rect = e.currentTarget.getBoundingClientRect()
                      const parent = e.currentTarget
                        .closest("[data-slot='chart-container']")
                        ?.getBoundingClientRect() ?? { left: 0, top: 0 }
                      setTooltipPos({
                        x: rect.left - parent.left + 6,
                        y: rect.top - parent.top - 60,
                      })
                    }}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-auto text-[10px] text-zinc-500 ml-8">
          <span>Less</span>
          {LEVEL_CLASSES.map((cls, i) => (
            <div key={i} className={`w-[12px] h-[12px] rounded-[2px] ${cls}`} />
          ))}
          <span>More</span>
        </div>

        {hoveredCell && (
          <div
            className="absolute z-50 pointer-events-none bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-xs shadow-lg"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <div className="font-medium text-zinc-200">
              {formatDate(hoveredCell.date)}
            </div>
            <div className="text-zinc-400 mt-1 space-y-0.5">
              <div>{hoveredCell.messages} messages</div>
              <div>{hoveredCell.sessions} sessions</div>
              <div>{hoveredCell.toolCalls} tool calls</div>
            </div>
          </div>
        )}
      </div>
    </ChartContainer>
  )
}
