export const CHART_COLORS = {
  primary: "#3b82f6",
  secondary: "#8b5cf6",
  tertiary: "#06b6d4",
  quaternary: "#f59e0b",
  success: "#10b981",
  danger: "#ef4444",
  muted: "#6b7280",
} as const

export const MODEL_COLORS: Record<string, string> = {
  "claude-opus-4-6": "#8b5cf6",
  "claude-opus-4-5-20251101": "#7c3aed",
  "claude-sonnet-4-5-20250929": "#3b82f6",
  "claude-sonnet-4-6": "#2563eb",
  "claude-haiku-4-5-20251001": "#06b6d4",
}

export const TOKEN_COLORS = {
  input: "#3b82f6",
  output: "#10b981",
  cacheRead: "#8b5cf6",
  cacheCreation: "#f59e0b",
} as const

export const HEATMAP_COLORS = [
  "bg-zinc-800",
  "bg-emerald-900/40",
  "bg-emerald-700/50",
  "bg-emerald-500/60",
  "bg-emerald-400/80",
] as const

export function getModelColor(modelName: string): string {
  for (const [key, color] of Object.entries(MODEL_COLORS)) {
    if (modelName.includes(key) || key.includes(modelName)) {
      return color
    }
  }
  if (modelName.includes("opus")) return "#8b5cf6"
  if (modelName.includes("haiku")) return "#06b6d4"
  return "#3b82f6"
}

export function getModelDisplayName(modelName: string): string {
  if (modelName.includes("opus-4-6")) return "Opus 4.6"
  if (modelName.includes("opus-4-5")) return "Opus 4.5"
  if (modelName.includes("sonnet-4-6")) return "Sonnet 4.6"
  if (modelName.includes("sonnet-4-5")) return "Sonnet 4.5"
  if (modelName.includes("haiku-4-5")) return "Haiku 4.5"
  return modelName
}
