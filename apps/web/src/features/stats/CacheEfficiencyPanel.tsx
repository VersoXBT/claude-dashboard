import { useMemo } from 'react'
import type { ModelUsage } from '@/lib/parsers/types'
import type { CostBreakdown } from '@/features/cost-estimation/cost-estimation.types'
import { formatUSD } from '@/lib/utils/format'

interface CacheStats {
  totalCacheRead: number
  totalNonCacheInput: number
  cacheHitRate: number
  estimatedSavings: number
}

function computeCacheStats(
  modelUsage: ModelUsage,
  costBreakdown: CostBreakdown,
): CacheStats {
  let totalCacheRead = 0
  let totalNonCacheInput = 0

  for (const usage of Object.values(modelUsage)) {
    totalCacheRead += usage.cacheReadInputTokens
    totalNonCacheInput += usage.inputTokens
  }

  const totalInput = totalCacheRead + totalNonCacheInput
  const cacheHitRate = totalInput > 0 ? totalCacheRead / totalInput : 0

  // Savings = difference between what cached reads would cost at full input price
  // vs what they actually cost at cache read price
  const estimatedSavings = Object.values(costBreakdown.byModel).reduce(
    (sum, model) => {
      if (model.tokens.cacheReadInputTokens === 0) return sum
      // Find the ratio: full input cost vs cache read cost for these tokens
      const fullInputRate = model.inputCost > 0 && model.tokens.inputTokens > 0
        ? model.inputCost / model.tokens.inputTokens
        : 0
      const cacheReadRate = model.cacheReadCost > 0 && model.tokens.cacheReadInputTokens > 0
        ? model.cacheReadCost / model.tokens.cacheReadInputTokens
        : 0
      const savedPerToken = fullInputRate - cacheReadRate
      return sum + savedPerToken * model.tokens.cacheReadInputTokens
    },
    0,
  )

  return { totalCacheRead, totalNonCacheInput, cacheHitRate, estimatedSavings }
}

export function CacheEfficiencyPanel({
  modelUsage,
  costBreakdown,
}: {
  modelUsage: ModelUsage
  costBreakdown: CostBreakdown
}) {
  const stats = useMemo(
    () => computeCacheStats(modelUsage, costBreakdown),
    [modelUsage, costBreakdown],
  )

  const cachePercent = Math.round(stats.cacheHitRate * 100)
  const nonCachePercent = 100 - cachePercent

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
      <h3 className="text-sm font-semibold text-gray-300">Cache Efficiency</h3>
      <p className="mt-1 text-xs text-gray-500">
        Prompt cache performance across all models
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
          <p className="text-xs text-gray-400">Cache Hit Rate</p>
          <p className="mt-1 text-2xl font-bold text-gray-100">
            {cachePercent}%
          </p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
          <p className="text-xs text-gray-400">Est. Savings</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">
            {formatUSD(stats.estimatedSavings)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Cache vs Non-Cache Input</span>
          <span>
            {cachePercent}% cached
          </span>
        </div>
        <div className="mt-1.5 flex h-3 overflow-hidden rounded-full bg-gray-800">
          {cachePercent > 0 && (
            <div
              className="rounded-l-full bg-emerald-500 transition-all"
              style={{ width: `${cachePercent}%` }}
            />
          )}
          {nonCachePercent > 0 && (
            <div
              className="bg-gray-600 transition-all"
              style={{
                width: `${nonCachePercent}%`,
                borderTopRightRadius: '9999px',
                borderBottomRightRadius: '9999px',
              }}
            />
          )}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-gray-400">Cached</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-gray-600" />
            <span className="text-gray-400">Non-cached</span>
          </div>
        </div>
      </div>
    </div>
  )
}
