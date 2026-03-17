import type { ModelPricing, ModelUsage, CostBreakdown, DailyModelTokens } from "./types"

const MODEL_PRICING: Record<string, ModelPricing> = {
  "claude-opus-4-6": {
    inputPerMTok: 15,
    outputPerMTok: 75,
    cacheReadPerMTok: 1.5,
    cacheCreationPerMTok: 18.75,
  },
  "claude-opus-4-5-20251101": {
    inputPerMTok: 15,
    outputPerMTok: 75,
    cacheReadPerMTok: 1.5,
    cacheCreationPerMTok: 18.75,
  },
  "claude-sonnet-4-5-20250929": {
    inputPerMTok: 3,
    outputPerMTok: 15,
    cacheReadPerMTok: 0.3,
    cacheCreationPerMTok: 3.75,
  },
  "claude-sonnet-4-6": {
    inputPerMTok: 3,
    outputPerMTok: 15,
    cacheReadPerMTok: 0.3,
    cacheCreationPerMTok: 3.75,
  },
  "claude-haiku-4-5-20251001": {
    inputPerMTok: 0.8,
    outputPerMTok: 4,
    cacheReadPerMTok: 0.08,
    cacheCreationPerMTok: 1,
  },
}

const DEFAULT_PRICING: ModelPricing = {
  inputPerMTok: 3,
  outputPerMTok: 15,
  cacheReadPerMTok: 0.3,
  cacheCreationPerMTok: 3.75,
}

export function getPricingForModel(modelName: string): ModelPricing {
  const exactMatch = MODEL_PRICING[modelName]
  if (exactMatch) return exactMatch

  for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
    if (modelName.startsWith(key) || key.startsWith(modelName)) {
      return pricing
    }
  }

  if (modelName.includes("opus")) {
    return MODEL_PRICING["claude-opus-4-6"]
  }
  if (modelName.includes("haiku")) {
    return MODEL_PRICING["claude-haiku-4-5-20251001"]
  }

  return DEFAULT_PRICING
}

export function calculateModelCost(usage: ModelUsage, modelName: string): number {
  const pricing = getPricingForModel(modelName)
  const inputCost = (usage.inputTokens / 1_000_000) * pricing.inputPerMTok
  const outputCost = (usage.outputTokens / 1_000_000) * pricing.outputPerMTok
  const cacheReadCost = (usage.cacheReadInputTokens / 1_000_000) * pricing.cacheReadPerMTok
  const cacheCreationCost = (usage.cacheCreationInputTokens / 1_000_000) * pricing.cacheCreationPerMTok
  return inputCost + outputCost + cacheReadCost + cacheCreationCost
}

export function calculateCostBreakdown(
  modelUsage: Record<string, ModelUsage>,
  dailyModelTokens: readonly DailyModelTokens[]
): CostBreakdown {
  const costByModel: Record<string, number> = {}
  let totalCost = 0

  for (const [model, usage] of Object.entries(modelUsage)) {
    const cost = calculateModelCost(usage, model)
    costByModel[model] = cost
    totalCost += cost
  }

  const now = new Date()
  const todayStr = now.toISOString().split("T")[0]
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  let costToday = 0
  let costThisWeek = 0
  let costThisMonth = 0
  let daysThisMonth = 0

  for (const day of dailyModelTokens) {
    let dayCost = 0
    for (const [model, tokens] of Object.entries(day.tokensByModel)) {
      const pricing = getPricingForModel(model)
      dayCost += (tokens / 1_000_000) * pricing.outputPerMTok
    }

    const dayDate = new Date(day.date)
    if (day.date === todayStr) costToday = dayCost
    if (dayDate >= weekAgo) costThisWeek += dayCost
    if (dayDate >= monthStart) {
      costThisMonth += dayCost
      daysThisMonth++
    }
  }

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const projectedMonthly = daysThisMonth > 0
    ? (costThisMonth / daysThisMonth) * daysInMonth
    : 0

  return {
    totalCost,
    costByModel,
    costToday,
    costThisWeek,
    costThisMonth,
    projectedMonthly,
  }
}

export function calculateCacheHitRate(modelUsage: Record<string, ModelUsage>): number {
  let totalCacheRead = 0
  let totalInput = 0

  for (const usage of Object.values(modelUsage)) {
    totalCacheRead += usage.cacheReadInputTokens
    totalInput += usage.inputTokens
  }

  const totalRequests = totalCacheRead + totalInput
  if (totalRequests === 0) return 0
  return (totalCacheRead / totalRequests) * 100
}

export function calculateCacheSavings(modelUsage: Record<string, ModelUsage>): number {
  let savings = 0
  for (const [model, usage] of Object.entries(modelUsage)) {
    const pricing = getPricingForModel(model)
    const fullCost = (usage.cacheReadInputTokens / 1_000_000) * pricing.inputPerMTok
    const cachedCost = (usage.cacheReadInputTokens / 1_000_000) * pricing.cacheReadPerMTok
    savings += fullCost - cachedCost
  }
  return savings
}

export { MODEL_PRICING }
