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
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-zinc-300">
              {title}
            </CardTitle>
            {subtitle && (
              <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className={height}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Skeleton className="w-full h-full rounded-lg" />
            </div>
          ) : isEmpty ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-zinc-500">No data available</p>
            </div>
          ) : (
            children
          )}
        </div>
      </CardContent>
    </Card>
  )
}
