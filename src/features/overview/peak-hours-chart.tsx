"use client"

import { useMemo } from "react"
import { ChartContainer } from "@/components/charts/chart-container"

interface PeakHoursChartProps {
  readonly hourCounts: Readonly<Record<string, number>>
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number
): { x: number; y: number } {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  }
}

function describeArc(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number
): string {
  const outerStart = polarToCartesian(cx, cy, outerR, startAngle)
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle)
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle)
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ")
}

export function PeakHoursChart({ hourCounts }: PeakHoursChartProps) {
  const { segments, maxCount, totalSessions } = useMemo(() => {
    let max = 0
    let total = 0
    const segs = Array.from({ length: 24 }, (_, hour) => {
      const count = hourCounts[String(hour)] ?? 0
      if (count > max) max = count
      total += count
      return { hour, count }
    })
    return { segments: segs, maxCount: max, totalSessions: total }
  }, [hourCounts])

  const cx = 150
  const cy = 150
  const innerRadius = 45
  const maxOuterRadius = 130

  return (
    <ChartContainer
      title="Peak Coding Hours"
      subtitle="Session distribution by hour"
      height="h-[350px]"
      isEmpty={totalSessions === 0}
    >
      <div className="flex items-center justify-center h-full">
        <svg viewBox="0 0 300 300" className="w-full max-w-[300px] h-auto">
          {segments.map(({ hour, count }) => {
            const startAngle = hour * 15
            const endAngle = startAngle + 14
            const intensity = maxCount > 0 ? count / maxCount : 0
            const outerR =
              innerRadius + (maxOuterRadius - innerRadius) * Math.max(intensity, 0.08)

            const opacity = count === 0 ? 0.15 : 0.3 + intensity * 0.7
            const color =
              count === 0
                ? "#3f3f46"
                : intensity > 0.75
                  ? "#34d399"
                  : intensity > 0.5
                    ? "#10b981"
                    : intensity > 0.25
                      ? "#059669"
                      : "#047857"

            const labelAngle = startAngle + 7
            const labelPos = polarToCartesian(cx, cy, maxOuterRadius + 10, labelAngle)

            return (
              <g key={hour}>
                <path
                  d={describeArc(cx, cy, innerRadius, outerR, startAngle, endAngle)}
                  fill={color}
                  opacity={opacity}
                  stroke="#18181b"
                  strokeWidth={1}
                >
                  <title>
                    {`${hour.toString().padStart(2, "0")}:00 - ${count} sessions`}
                  </title>
                </path>
                {hour % 3 === 0 && (
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#71717a"
                    fontSize="9"
                  >
                    {`${hour.toString().padStart(2, "0")}h`}
                  </text>
                )}
              </g>
            )
          })}
          <text
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            fill="#e4e4e7"
            fontSize="16"
            fontWeight="bold"
          >
            {totalSessions}
          </text>
          <text
            x={cx}
            y={cy + 10}
            textAnchor="middle"
            fill="#71717a"
            fontSize="10"
          >
            sessions
          </text>
        </svg>
      </div>
    </ChartContainer>
  )
}
