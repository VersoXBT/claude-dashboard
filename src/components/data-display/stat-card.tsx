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
      ? "text-[#6EAE7E]"
      : deltaType === "negative"
        ? "text-[#C45B5B]"
        : "text-muted-foreground"

  return (
    <Card className="relative overflow-hidden border-border bg-card hover:bg-[#2D2822] transition-all duration-200 group">
      <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-[#D4714E] to-[#D4A04E] opacity-60 group-hover:opacity-100 transition-opacity" />
      <CardContent className="p-5 pl-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          {Icon && <Icon className="h-4 w-4 text-[#D4714E]" />}
        </div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {(subtitle ?? delta) && (
          <div className="flex items-center gap-2 mt-1.5">
            {delta && (
              <span className={`text-xs font-medium ${deltaColor}`}>
                {delta}
              </span>
            )}
            {subtitle && (
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
