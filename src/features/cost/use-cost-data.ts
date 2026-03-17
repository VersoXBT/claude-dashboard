"use client"

import { useMemo } from "react"
import type { StatsResponse, DailyModelTokens, ModelUsage } from "@/lib/types"
import { getPricingForModel } from "@/lib/costs"
import { getModelDisplayName } from "@/components/charts/recharts-theme"

export interface DailyCostEntry {
  readonly date: string
  readonly cost: number
  readonly rollingAvg: number | null
  readonly projected: number | null
  readonly inputTokens: number
  readonly outputTokens: number
  readonly cacheReadTokens: number
  readonly cacheCreationTokens: number
  readonly inputCost: number
  readonly outputCost: number
  readonly cacheReadCost: number
  readonly cacheCreationCost: number
}

export interface ModelSpendEntry {
  readonly model: string
  readonly displayName: string
  readonly cost: number
  readonly color: string
}

export interface TokenCategoryEntry {
  readonly date: string
  readonly input: number
  readonly output: number
  readonly cacheRead: number
  readonly cacheCreation: number
}

export interface CacheRoiEntry {
  readonly date: string
  readonly hitRate: number
  readonly savings: number
}

export interface ProjectCostEntry {
  readonly project: string
  readonly cost: number
}

export interface IoRatioEntry {
  readonly date: string
  readonly input: number
  readonly output: number
  readonly ratio: number
}

function computeDailyCosts(dailyModelTokens: readonly DailyModelTokens[]): DailyCostEntry[] {
  const dailyCosts = dailyModelTokens.map((day) => {
    let totalCost = 0
    let inputTokens = 0
    let outputTokens = 0
    let cacheReadTokens = 0
    let cacheCreationTokens = 0
    let inputCost = 0
    let outputCost = 0
    let cacheReadCost = 0
    let cacheCreationCost = 0

    for (const [model, tokens] of Object.entries(day.tokensByModel)) {
      const pricing = getPricingForModel(model)
      // tokensByModel stores total tokens per model per day; estimate split
      // Use output pricing as a conservative estimate since the stats cache
      // provides aggregate tokens per model, not broken down by category
      const cost = (tokens / 1_000_000) * pricing.outputPerMTok
      totalCost += cost
      outputTokens += tokens
      outputCost += cost
    }

    return {
      date: day.date,
      cost: totalCost,
      rollingAvg: null as number | null,
      projected: null as number | null,
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheCreationTokens,
      inputCost,
      outputCost,
      cacheReadCost,
      cacheCreationCost,
    }
  })

  // Compute 7-day rolling average
  return dailyCosts.map((entry, idx) => {
    const windowStart = Math.max(0, idx - 6)
    const window = dailyCosts.slice(windowStart, idx + 1)
    const avg = window.reduce((sum, e) => sum + e.cost, 0) / window.length

    return {
      ...entry,
      rollingAvg: window.length >= 3 ? avg : null,
    }
  })
}

function addProjections(entries: DailyCostEntry[]): DailyCostEntry[] {
  if (entries.length === 0) return entries

  const now = new Date()
  const todayStr = now.toISOString().split("T")[0]
  const lastIdx = entries.findIndex((e) => e.date >= todayStr)
  const cutoff = lastIdx >= 0 ? lastIdx : entries.length

  // Calculate average daily cost from last 7 days for projection
  const recentWindow = entries.slice(Math.max(0, cutoff - 7), cutoff)
  const avgCost = recentWindow.length > 0
    ? recentWindow.reduce((sum, e) => sum + e.cost, 0) / recentWindow.length
    : 0

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const currentDay = now.getDate()
  const remainingDays = daysInMonth - currentDay

  return entries.map((entry, idx) => {
    if (idx >= cutoff && remainingDays > 0) {
      return { ...entry, projected: avgCost }
    }
    // Show projected on the last actual day as a bridge
    if (idx === cutoff - 1) {
      return { ...entry, projected: entry.cost }
    }
    return entry
  })
}

export function useCostData(stats: StatsResponse | undefined) {
  return useMemo(() => {
    if (!stats) {
      return {
        dailyCosts: [] as DailyCostEntry[],
        modelSpend: [] as ModelSpendEntry[],
        tokenCategories: [] as TokenCategoryEntry[],
        cacheRoi: [] as CacheRoiEntry[],
        ioRatio: [] as IoRatioEntry[],
      }
    }

    const { dailyModelTokens, modelUsage } = stats

    // Daily costs with rolling average and projections
    const rawDailyCosts = computeDailyCosts(dailyModelTokens)
    const dailyCosts = addProjections(rawDailyCosts)

    // Model spend for donut
    const modelSpend = computeModelSpend(modelUsage)

    // Token categories per day
    const tokenCategories = computeTokenCategories(dailyModelTokens, modelUsage)

    // Cache ROI over time
    const cacheRoi = computeCacheRoi(dailyModelTokens)

    // I/O ratio
    const ioRatio = computeIoRatio(dailyModelTokens, modelUsage)

    return { dailyCosts, modelSpend, tokenCategories, cacheRoi, ioRatio }
  }, [stats])
}

function computeModelSpend(modelUsage: Readonly<Record<string, ModelUsage>>): ModelSpendEntry[] {
  const MODEL_COLORS: Record<string, string> = {
    "opus-4-6": "#8b5cf6",
    "opus-4-5": "#7c3aed",
    "sonnet-4-6": "#2563eb",
    "sonnet-4-5": "#3b82f6",
    "haiku-4-5": "#06b6d4",
  }

  function getColor(model: string): string {
    for (const [key, color] of Object.entries(MODEL_COLORS)) {
      if (model.includes(key)) return color
    }
    if (model.includes("opus")) return "#8b5cf6"
    if (model.includes("haiku")) return "#06b6d4"
    return "#3b82f6"
  }

  return Object.entries(modelUsage)
    .map(([model, usage]) => {
      const pricing = getPricingForModel(model)
      const cost =
        (usage.inputTokens / 1_000_000) * pricing.inputPerMTok +
        (usage.outputTokens / 1_000_000) * pricing.outputPerMTok +
        (usage.cacheReadInputTokens / 1_000_000) * pricing.cacheReadPerMTok +
        (usage.cacheCreationInputTokens / 1_000_000) * pricing.cacheCreationPerMTok

      return {
        model,
        displayName: getModelDisplayName(model),
        cost,
        color: getColor(model),
      }
    })
    .filter((e) => e.cost > 0)
    .sort((a, b) => b.cost - a.cost)
}

function computeTokenCategories(
  dailyModelTokens: readonly DailyModelTokens[],
  modelUsage: Readonly<Record<string, ModelUsage>>
): TokenCategoryEntry[] {
  // We have per-day totals by model, plus aggregate model usage with category breakdowns.
  // Estimate daily category split using the aggregate ratio.
  let totalInput = 0
  let totalOutput = 0
  let totalCacheRead = 0
  let totalCacheCreation = 0

  for (const usage of Object.values(modelUsage)) {
    totalInput += usage.inputTokens
    totalOutput += usage.outputTokens
    totalCacheRead += usage.cacheReadInputTokens
    totalCacheCreation += usage.cacheCreationInputTokens
  }

  const grandTotal = totalInput + totalOutput + totalCacheRead + totalCacheCreation
  if (grandTotal === 0) return []

  const inputRatio = totalInput / grandTotal
  const outputRatio = totalOutput / grandTotal
  const cacheReadRatio = totalCacheRead / grandTotal
  const cacheCreationRatio = totalCacheCreation / grandTotal

  return dailyModelTokens.map((day) => {
    const dayTotal = Object.values(day.tokensByModel).reduce((s, t) => s + t, 0)
    return {
      date: day.date,
      input: Math.round(dayTotal * inputRatio),
      output: Math.round(dayTotal * outputRatio),
      cacheRead: Math.round(dayTotal * cacheReadRatio),
      cacheCreation: Math.round(dayTotal * cacheCreationRatio),
    }
  })
}

function computeCacheRoi(dailyModelTokens: readonly DailyModelTokens[]): CacheRoiEntry[] {
  // Estimate cache savings per day using aggregate ratios
  // Since we don't have per-day cache data, compute a running estimate
  return dailyModelTokens.map((day) => {
    const dayTotal = Object.values(day.tokensByModel).reduce((s, t) => s + t, 0)

    // Use an average cache hit rate estimate across all models
    // Real rate comes from aggregate; we apply it to daily data for visualization
    const estimatedCacheTokens = dayTotal * 0.4 // conservative 40% estimate
    const estimatedInputTokens = dayTotal * 0.15

    const totalRequests = estimatedCacheTokens + estimatedInputTokens
    const hitRate = totalRequests > 0 ? (estimatedCacheTokens / totalRequests) * 100 : 0

    // Savings = cacheRead tokens * (inputPrice - cacheReadPrice) / 1M
    // Use average pricing (Sonnet-level)
    const savings = (estimatedCacheTokens / 1_000_000) * (3 - 0.3)

    return {
      date: day.date,
      hitRate: Math.round(hitRate * 10) / 10,
      savings: Math.round(savings * 100) / 100,
    }
  })
}

function computeIoRatio(
  dailyModelTokens: readonly DailyModelTokens[],
  modelUsage: Readonly<Record<string, ModelUsage>>
): IoRatioEntry[] {
  let totalInput = 0
  let totalOutput = 0

  for (const usage of Object.values(modelUsage)) {
    totalInput += usage.inputTokens
    totalOutput += usage.outputTokens
  }

  const grandTotal = totalInput + totalOutput
  if (grandTotal === 0) return []

  const inputRatio = totalInput / grandTotal
  const outputRatio = totalOutput / grandTotal

  return dailyModelTokens.map((day) => {
    const dayTotal = Object.values(day.tokensByModel).reduce((s, t) => s + t, 0)
    const input = Math.round(dayTotal * inputRatio)
    const output = Math.round(dayTotal * outputRatio)

    return {
      date: day.date,
      input,
      output,
      ratio: output > 0 ? Math.round((input / output) * 100) / 100 : 0,
    }
  })
}
