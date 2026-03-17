import { CLAUDE_COLORS } from "@/lib/theme"

export const CHART_COLORS = {
  primary: CLAUDE_COLORS.primary,
  secondary: CLAUDE_COLORS.chart2,
  tertiary: CLAUDE_COLORS.chart3,
  quaternary: CLAUDE_COLORS.chart4,
  success: CLAUDE_COLORS.success,
  danger: CLAUDE_COLORS.error,
  muted: CLAUDE_COLORS.textMuted,
} as const

export const MODEL_COLORS: Record<string, string> = {
  "claude-opus-4-6": CLAUDE_COLORS.chart7,
  "claude-opus-4-5-20251101": CLAUDE_COLORS.chart4,
  "claude-sonnet-4-5-20250929": CLAUDE_COLORS.primary,
  "claude-sonnet-4-6": CLAUDE_COLORS.primaryLight,
  "claude-haiku-4-5-20251001": CLAUDE_COLORS.chart2,
}

export const TOKEN_COLORS = {
  input: CLAUDE_COLORS.chart2,
  output: CLAUDE_COLORS.primary,
  cacheRead: CLAUDE_COLORS.chart3,
  cacheCreation: CLAUDE_COLORS.chart5,
} as const

export const HEATMAP_COLORS = [
  "bg-[#2D2822]",
  "bg-[#3D2E22]",
  "bg-[#5A3928]",
  "bg-[#8B4D30]",
  "bg-[#D4714E]",
] as const

export const CHART_GRID_COLOR = CLAUDE_COLORS.borderSubtle
export const CHART_AXIS_COLOR = CLAUDE_COLORS.textMuted

export const TOOLTIP_STYLE = {
  backgroundColor: CLAUDE_COLORS.bgSurface,
  borderColor: CLAUDE_COLORS.borderDefault,
  borderRadius: "8px",
  color: CLAUDE_COLORS.textPrimary,
} as const

export function getModelColor(modelName: string): string {
  for (const [key, color] of Object.entries(MODEL_COLORS)) {
    if (modelName.includes(key) || key.includes(modelName)) {
      return color
    }
  }
  if (modelName.includes("opus")) return CLAUDE_COLORS.chart7
  if (modelName.includes("haiku")) return CLAUDE_COLORS.chart2
  return CLAUDE_COLORS.primary
}

export function getModelDisplayName(modelName: string): string {
  if (modelName.includes("opus-4-6")) return "Opus 4.6"
  if (modelName.includes("opus-4-5")) return "Opus 4.5"
  if (modelName.includes("sonnet-4-6")) return "Sonnet 4.6"
  if (modelName.includes("sonnet-4-5")) return "Sonnet 4.5"
  if (modelName.includes("haiku-4-5")) return "Haiku 4.5"
  return modelName
}
