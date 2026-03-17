"use client"

import { useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DailyActivity } from "@/lib/types"

interface ActivityHeatmapProps {
  readonly dailyActivity: readonly DailyActivity[]
  readonly isLoading?: boolean
}

interface CellData {
  readonly date: string
  readonly messageCount: number
  readonly sessionCount: number
  readonly toolCallCount: number
  readonly level: number
}

function getIntensityColor(level: number): string {
  const colors = [
    "#231F1B",
    "rgba(212, 113, 78, 0.15)",
    "rgba(212, 113, 78, 0.3)",
    "rgba(212, 113, 78, 0.5)",
    "rgba(212, 113, 78, 0.8)",
  ] as const
  return colors[level] ?? colors[0]
}

function buildHeatmapGrid(
  dailyActivity: readonly DailyActivity[]
): readonly CellData[][] {
  const activityMap = new Map<string, DailyActivity>()
  for (const day of dailyActivity) {
    activityMap.set(day.date, day)
  }

  const messageCounts = dailyActivity
    .map((d) => d.messageCount)
    .filter((c) => c > 0)
  messageCounts.sort((a, b) => a - b)

  const p25 = messageCounts[Math.floor(messageCounts.length * 0.25)] ?? 1
  const p50 = messageCounts[Math.floor(messageCounts.length * 0.5)] ?? 3
  const p75 = messageCounts[Math.floor(messageCounts.length * 0.75)] ?? 10

  function getLevel(count: number): number {
    if (count === 0) return 0
    if (count <= p25) return 1
    if (count <= p50) return 2
    if (count <= p75) return 3
    return 4
  }

  const today = new Date()
  const todayDay = today.getDay()
  const endDate = new Date(today)
  endDate.setDate(endDate.getDate() + (6 - todayDay))

  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - 52 * 7 + 1)

  const weeks: CellData[][] = []
  let currentWeek: CellData[] = []

  const cursor = new Date(startDate)
  while (cursor <= endDate) {
    const dateStr = cursor.toISOString().split("T")[0]
    const activity = activityMap.get(dateStr)

    currentWeek.push({
      date: dateStr,
      messageCount: activity?.messageCount ?? 0,
      sessionCount: activity?.sessionCount ?? 0,
      toolCallCount: activity?.toolCallCount ?? 0,
      level: getLevel(activity?.messageCount ?? 0),
    })

    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }

    cursor.setDate(cursor.getDate() + 1)
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  return weeks
}

function getMonthLabels(
  weeks: readonly CellData[][]
): readonly { readonly label: string; readonly col: number }[] {
  const months: { label: string; col: number }[] = []
  let lastMonth = -1

  for (let col = 0; col < weeks.length; col++) {
    const firstDay = weeks[col][0]
    if (!firstDay) continue
    const date = new Date(firstDay.date + "T00:00:00")
    const month = date.getMonth()
    if (month !== lastMonth) {
      lastMonth = month
      months.push({
        label: date.toLocaleDateString("en-US", { month: "short" }),
        col,
      })
    }
  }

  return months
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function ActivityHeatmap({
  dailyActivity,
  isLoading = false,
}: ActivityHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredCell, setHoveredCell] = useState<CellData | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const weeks = useMemo(() => buildHeatmapGrid(dailyActivity), [dailyActivity])
  const monthLabels = useMemo(() => getMonthLabels(weeks), [weeks])

  if (isLoading) {
    return (
      <Card className="bg-[#231F1B] border-[#3D3830]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-[#B8AFA5]">
            Activity Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="h-[140px] animate-pulse bg-[#2D2822]/50 rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""]

  return (
    <Card className="bg-[#231F1B] border-[#3D3830]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-[#B8AFA5]">
            Activity Heatmap
          </CardTitle>
          <div className="flex items-center gap-1.5 text-xs text-[#7A7267]">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: getIntensityColor(level) }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 relative" ref={containerRef}>
        {/* Month labels */}
        <div className="flex ml-8 mb-1">
          {monthLabels.map(({ label, col }) => (
            <span
              key={`${label}-${col}`}
              className="text-[10px] text-[#7A7267] absolute"
              style={{ left: `${col * 14 + 32}px` }}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="flex gap-0 mt-4">
          {/* Day labels */}
          <div className="flex flex-col gap-[2px] mr-1.5 shrink-0">
            {dayLabels.map((label, i) => (
              <div
                key={i}
                className="h-[11px] text-[10px] text-[#7A7267] leading-[11px] w-6 text-right pr-1"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-[2px] overflow-x-auto">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[2px]">
                {week.map((cell, dayIdx) => (
                  <div
                    key={`${weekIdx}-${dayIdx}`}
                    className="w-[11px] h-[11px] rounded-sm cursor-pointer transition-colors hover:ring-1 hover:ring-[#D4714E]/50"
                    style={{ backgroundColor: getIntensityColor(cell.level) }}
                    onMouseEnter={(e) => {
                      setHoveredCell(cell)
                      const rect = e.currentTarget.getBoundingClientRect()
                      const parentRect =
                        containerRef.current?.getBoundingClientRect() ?? rect
                      setTooltipPos({
                        x: rect.left - parentRect.left + rect.width / 2,
                        y: rect.top - parentRect.top,
                      })
                    }}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Custom tooltip */}
        {hoveredCell && (
          <div
            className="absolute z-50 pointer-events-none bg-[#2D2822] border border-[#3D3830] rounded-md px-3 py-2 text-xs shadow-lg"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y - 8}px`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="font-medium text-[#F5F0EB] mb-1">
              {formatDate(hoveredCell.date)}
            </div>
            <div className="text-[#B8AFA5] space-y-0.5">
              <div>{hoveredCell.messageCount} messages</div>
              <div>{hoveredCell.sessionCount} sessions</div>
              <div>{hoveredCell.toolCallCount} tool calls</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
