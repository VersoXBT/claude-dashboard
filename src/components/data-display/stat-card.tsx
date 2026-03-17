"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  readonly title: string
  readonly value: string
  readonly subtitle?: string
  readonly delta?: string
  readonly deltaType?: "positive" | "negative" | "neutral"
  readonly icon?: LucideIcon
}

export function StatCard({
  title,
  value,
  subtitle,
  delta,
  deltaType = "neutral",
  icon: Icon,
}: StatCardProps) {
  const deltaColor =
    deltaType === "positive"
      ? "text-emerald-400"
      : deltaType === "negative"
        ? "text-red-400"
        : "text-zinc-500"

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            {title}
          </span>
          {Icon && <Icon className="h-4 w-4 text-zinc-500" />}
        </div>
        <div className="text-2xl font-bold text-zinc-100">{value}</div>
        {(subtitle ?? delta) && (
          <div className="flex items-center gap-2 mt-1.5">
            {delta && (
              <span className={`text-xs font-medium ${deltaColor}`}>
                {delta}
              </span>
            )}
            {subtitle && (
              <span className="text-xs text-zinc-500">{subtitle}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
