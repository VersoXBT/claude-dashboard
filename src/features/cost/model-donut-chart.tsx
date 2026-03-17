"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { ChartContainer } from "@/components/charts/chart-container"
import { TOOLTIP_STYLE } from "@/components/charts/recharts-theme"
import { CLAUDE_COLORS } from "@/lib/theme"
import type { ModelSpendEntry } from "./use-cost-data"

interface ModelDonutChartProps {
  readonly data: readonly ModelSpendEntry[]
  readonly isLoading: boolean
  readonly totalCost: number
}

export function ModelDonutChart({ data, isLoading, totalCost }: ModelDonutChartProps) {
  return (
    <ChartContainer
      title="Spend by Model"
      subtitle="Cost distribution across models"
      isLoading={isLoading}
      isEmpty={data.length === 0}
      height="h-[320px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="cost"
            nameKey="displayName"
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="85%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.model} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: TOOLTIP_STYLE.backgroundColor,
              border: `1px solid ${TOOLTIP_STYLE.borderColor}`,
              borderRadius: TOOLTIP_STYLE.borderRadius,
              fontSize: "12px",
            }}
            formatter={(value) => [`$${Number(value).toFixed(2)}`, "Cost"]}
          />
          {/* Center label */}
          <text
            x="50%"
            y="47%"
            textAnchor="middle"
            dominantBaseline="middle"
            fill={CLAUDE_COLORS.textPrimary}
            style={{ fontSize: "20px", fontWeight: 700 }}
          >
            ${totalCost.toFixed(0)}
          </text>
          <text
            x="50%"
            y="57%"
            textAnchor="middle"
            dominantBaseline="middle"
            fill={CLAUDE_COLORS.textMuted}
            style={{ fontSize: "11px" }}
          >
            total spend
          </text>
        </PieChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center mt-1 px-2">
        {data.map((entry) => (
          <div key={entry.model} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs" style={{ color: CLAUDE_COLORS.textSecondary }}>{entry.displayName}</span>
          </div>
        ))}
      </div>
    </ChartContainer>
  )
}
