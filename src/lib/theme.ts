export const CLAUDE_COLORS = {
  primary: "#D4714E",
  primaryLight: "#E8956A",
  primaryDark: "#B85C3A",
  accent: "#D4A04E",

  bgRoot: "#1A1714",
  bgSurface: "#231F1B",
  bgElevated: "#2D2822",
  bgSidebar: "#1E1B17",

  borderDefault: "#3D3830",
  borderSubtle: "#302C26",

  textPrimary: "#F5F0EB",
  textSecondary: "#B8AFA5",
  textMuted: "#7A7267",
  textDim: "#564F47",

  chart1: "#D4714E",
  chart2: "#5BA3A8",
  chart3: "#D4A04E",
  chart4: "#7B8DBF",
  chart5: "#6EAE7E",
  chart6: "#C47A8E",
  chart7: "#9B8EC4",
  chart8: "#D49E6A",

  success: "#6EAE7E",
  warning: "#D4A04E",
  error: "#C45B5B",
  info: "#5BA3A8",
} as const

export type ClaudeColorKey = keyof typeof CLAUDE_COLORS

export const CHART_PALETTE = [
  CLAUDE_COLORS.chart1,
  CLAUDE_COLORS.chart2,
  CLAUDE_COLORS.chart3,
  CLAUDE_COLORS.chart4,
  CLAUDE_COLORS.chart5,
  CLAUDE_COLORS.chart6,
  CLAUDE_COLORS.chart7,
  CLAUDE_COLORS.chart8,
] as const
