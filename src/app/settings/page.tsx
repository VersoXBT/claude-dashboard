"use client"

import { useStats, useProjects } from "@/hooks/use-dashboard-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { MODEL_PRICING, getPricingForModel } from "@/lib/costs"
import { Settings, Database, Info, DollarSign } from "lucide-react"

function formatModelName(key: string): string {
  return key
    .replace("claude-", "Claude ")
    .replace(/-/g, " ")
    .replace(/(\d)/, " $1")
    .replace(/\s+/g, " ")
    .trim()
}

function formatPrice(price: number): string {
  if (price < 0.01) return `$${price.toFixed(3)}`
  return `$${price.toFixed(2)}`
}

export default function SettingsPage() {
  const { data: stats, isLoading: statsLoading } = useStats()
  const { data: projectsData, isLoading: projectsLoading } = useProjects()

  const projects = projectsData?.projects ?? []
  const totalSessions = stats?.totalSessions ?? 0
  const totalMessages = stats?.totalMessages ?? 0
  const firstSessionDate = stats?.firstSessionDate ?? ""

  const pricingEntries = Object.entries(MODEL_PRICING).map(([key, pricing]) => ({
    key,
    displayName: formatModelName(key),
    ...pricing,
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-[#F5F0EB]">Settings</h1>
        <p className="text-sm text-[#7A7267] mt-1">Dashboard configuration, pricing, and data sources</p>
      </div>

      <Card className="bg-[#231F1B]/50 border-[#3D3830]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-[#D4714E]" />
            <CardTitle className="text-sm font-medium text-[#F5F0EB]">
              Model Pricing
            </CardTitle>
          </div>
          <p className="text-xs text-[#7A7267] mt-1">
            Current pricing table used for cost estimation (read-only)
          </p>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="rounded-lg border border-[#3D3830] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-[#302C26] hover:bg-transparent bg-[#2D2822]">
                  <TableHead className="text-[#B8AFA5]">Model</TableHead>
                  <TableHead className="text-[#B8AFA5] text-right">Input $/MTok</TableHead>
                  <TableHead className="text-[#B8AFA5] text-right">Output $/MTok</TableHead>
                  <TableHead className="text-[#B8AFA5] text-right">Cache Read $/MTok</TableHead>
                  <TableHead className="text-[#B8AFA5] text-right">Cache Create $/MTok</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pricingEntries.map((entry, index) => (
                  <TableRow
                    key={entry.key}
                    className={`border-[#302C26] ${index % 2 === 0 ? "bg-[#231F1B]" : "bg-[#1E1B17]"}`}
                  >
                    <TableCell className="text-[#F5F0EB] font-medium text-sm">
                      <code className="text-xs font-mono text-[#D4A04E] bg-[#D4A04E]/10 px-1.5 py-0.5 rounded">
                        {entry.key}
                      </code>
                    </TableCell>
                    <TableCell className="text-right text-[#B8AFA5] font-mono text-xs">
                      {formatPrice(entry.inputPerMTok)}
                    </TableCell>
                    <TableCell className="text-right text-[#B8AFA5] font-mono text-xs">
                      {formatPrice(entry.outputPerMTok)}
                    </TableCell>
                    <TableCell className="text-right text-[#B8AFA5] font-mono text-xs">
                      {formatPrice(entry.cacheReadPerMTok)}
                    </TableCell>
                    <TableCell className="text-right text-[#B8AFA5] font-mono text-xs">
                      {formatPrice(entry.cacheCreationPerMTok)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#231F1B]/50 border-[#3D3830]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-[#D4714E]" />
            <CardTitle className="text-sm font-medium text-[#F5F0EB]">
              Data Source
            </CardTitle>
          </div>
          <p className="text-xs text-[#7A7267] mt-1">
            Where this dashboard reads your Claude Code data from
          </p>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {statsLoading || projectsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full bg-[#2D2822]" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <DataRow label="Source path" value="~/.claude/" />
              <DataRow label="Total projects" value={String(projects.length)} />
              <DataRow label="Total sessions" value={totalSessions.toLocaleString()} />
              <DataRow label="Total messages" value={totalMessages.toLocaleString()} />
              {firstSessionDate && (
                <DataRow
                  label="Data since"
                  value={new Date(firstSessionDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#231F1B]/50 border-[#3D3830]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-[#D4714E]" />
            <CardTitle className="text-sm font-medium text-[#F5F0EB]">
              About
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-3">
            <DataRow label="Dashboard" value="Claude Dashboard" />
            <DataRow label="Version" value="1.0.0" />
            <div className="flex items-center justify-between py-2 border-b border-[#302C26]">
              <span className="text-xs text-[#7A7267] uppercase tracking-wider">Source</span>
              <a
                href="https://github.com/anthropics/claude-code"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#D4714E] hover:text-[#E8956A] transition-colors"
              >
                github.com/anthropics/claude-code
              </a>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-[#7A7267] uppercase tracking-wider">Powered by</span>
              <span className="text-sm text-[#B8AFA5]">Next.js + Recharts + Tailwind</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DataRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#302C26]">
      <span className="text-xs text-[#7A7267] uppercase tracking-wider">{label}</span>
      <span className="text-sm text-[#F5F0EB] font-mono">{value}</span>
    </div>
  )
}
