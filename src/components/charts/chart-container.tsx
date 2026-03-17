"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface ChartContainerProps {
  readonly title: string
  readonly subtitle?: string
  readonly children: React.ReactNode
  readonly isLoading?: boolean
  readonly isEmpty?: boolean
  readonly height?: string
  readonly actions?: React.ReactNode
}

export function ChartContainer({
  title,
  subtitle,
  children,
  isLoading = false,
  isEmpty = false,
  height = "h-[300px]",
  actions,
}: ChartContainerProps) {
  return (
    <Card className="relative overflow-hidden border-border bg-card">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#D4714E] via-[#D4A04E] to-[#D4714E] opacity-40" />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">
              {title}
            </CardTitle>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className={height}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Skeleton className="w-full h-full rounded-lg bg-[#2D2822]" />
            </div>
          ) : isEmpty ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">No data available</p>
            </div>
          ) : (
            children
          )}
        </div>
      </CardContent>
    </Card>
  )
}
