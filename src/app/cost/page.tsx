"use client"

import { useStats, useProjects } from "@/hooks/use-dashboard-data"
import { calculateCostBreakdown, calculateCacheHitRate, calculateCacheSavings } from "@/lib/costs"
import { StatCard } from "@/components/data-display/stat-card"
import { Skeleton } from "@/components/ui/skeleton"
import { DollarSign, TrendingUp, Calendar, Database, PiggyBank } from "lucide-react"
import { useCostData } from "@/features/cost/use-cost-data"
import { CostTrendChart } from "@/features/cost/cost-trend-chart"
import { ModelDonutChart } from "@/features/cost/model-donut-chart"
import { TokenCategoriesChart } from "@/features/cost/token-categories-chart"
import { CacheRoiChart } from "@/features/cost/cache-roi-chart"
import { ProjectCostChart } from "@/features/cost/project-cost-chart"
import { IoRatioChart } from "@/features/cost/io-ratio-chart"

function formatCost(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`
  return `$${n.toFixed(2)}`
}

export default function CostPage() {
  const { data: stats, isLoading: statsLoading } = useStats()
  const { data: projectsData, isLoading: projectsLoading } = useProjects()

  const costBreakdown = stats
    ? calculateCostBreakdown(stats.modelUsage, stats.dailyModelTokens)
    : null

  const cacheHitRate = stats ? calculateCacheHitRate(stats.modelUsage) : 0
  const cacheSavings = stats ? calculateCacheSavings(stats.modelUsage) : 0

  const { dailyCosts, modelSpend, tokenCategories, cacheRoi, ioRatio } = useCostData(stats)

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Cost & Tokens</h1>
          <p className="text-sm text-zinc-500 mt-1">Financial analytics and token usage breakdown</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <Skeleton className="lg:col-span-8 h-[360px] rounded-lg" />
          <Skeleton className="lg:col-span-4 h-[360px] rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Cost & Tokens</h1>
        <p className="text-sm text-zinc-500 mt-1">Financial analytics and token usage breakdown</p>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="Total Spend"
          value={formatCost(costBreakdown?.totalCost ?? 0)}
          subtitle="all time"
          icon={DollarSign}
        />
        <StatCard
          title="MTD Spend"
          value={formatCost(costBreakdown?.costThisMonth ?? 0)}
          subtitle="month to date"
          delta={`$${(costBreakdown?.costToday ?? 0).toFixed(2)} today`}
          deltaType="neutral"
          icon={Calendar}
        />
        <StatCard
          title="Projected Monthly"
          value={formatCost(costBreakdown?.projectedMonthly ?? 0)}
          subtitle="based on current pace"
          icon={TrendingUp}
        />
        <StatCard
          title="Cache Hit Rate"
          value={`${cacheHitRate.toFixed(1)}%`}
          subtitle="cache read / total input"
          deltaType={cacheHitRate > 50 ? "positive" : "neutral"}
          delta={cacheHitRate > 50 ? "Good" : undefined}
          icon={Database}
        />
        <StatCard
          title="Cache Savings"
          value={formatCost(cacheSavings)}
          subtitle="vs uncached pricing"
          deltaType="positive"
          icon={PiggyBank}
        />
      </div>

      {/* Row 2: Cost Trends + Model Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8">
          <CostTrendChart data={dailyCosts} isLoading={statsLoading} />
        </div>
        <div className="lg:col-span-4">
          <ModelDonutChart
            data={modelSpend}
            isLoading={statsLoading}
            totalCost={costBreakdown?.totalCost ?? 0}
          />
        </div>
      </div>

      {/* Row 3: Token Categories + Cache ROI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TokenCategoriesChart data={tokenCategories} isLoading={statsLoading} />
        <CacheRoiChart data={cacheRoi} isLoading={statsLoading} />
      </div>

      {/* Row 4: Cost per Project + I/O Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProjectCostChart
          projects={projectsData?.projects ?? []}
          isLoading={projectsLoading}
        />
        <IoRatioChart data={ioRatio} isLoading={statsLoading} />
      </div>
    </div>
  )
}
