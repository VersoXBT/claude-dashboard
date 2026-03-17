import { useMemo } from 'react'

interface SkillsOverviewProps {
  skillInvocations?: Record<string, number>
  agentDispatches?: Record<string, number>
}

interface RankedEntry {
  readonly name: string
  readonly count: number
  readonly ratio: number
}

function rankEntries(
  record: Record<string, number> | undefined,
  limit: number,
): readonly RankedEntry[] {
  if (!record) return []

  const sorted = Object.entries(record)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)

  const max = sorted.length > 0 ? sorted[0].count : 1

  return sorted.map((entry) => ({
    ...entry,
    ratio: max > 0 ? entry.count / max : 0,
  }))
}

function EntryRow({
  entry,
  badgeColor,
  barColor,
  prefix,
}: {
  entry: RankedEntry
  badgeColor: string
  barColor: string
  prefix?: string
}) {
  return (
    <div className="rounded bg-gray-950/40 px-2 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <span
          className="shrink-0 truncate rounded px-1.5 py-0.5 text-[10px] font-semibold"
          style={{
            backgroundColor: `${badgeColor}20`,
            color: badgeColor,
            maxWidth: '70%',
          }}
          title={entry.name}
        >
          {prefix}{entry.name}
        </span>
        <span className="shrink-0 text-xs font-mono tabular-nums text-gray-300">
          {entry.count.toLocaleString()}
        </span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-gray-800">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.max(entry.ratio * 100, 1)}%`,
            backgroundColor: barColor,
            opacity: 0.7,
          }}
        />
      </div>
    </div>
  )
}

function EmptyColumn({ label }: { label: string }) {
  return (
    <div className="flex h-32 items-center justify-center">
      <p className="text-sm text-gray-500">No {label} data</p>
    </div>
  )
}

export function SkillsOverviewPanel({
  skillInvocations,
  agentDispatches,
}: SkillsOverviewProps) {
  const skills = useMemo(
    () => rankEntries(skillInvocations, 10),
    [skillInvocations],
  )

  const agents = useMemo(
    () => rankEntries(agentDispatches, 10),
    [agentDispatches],
  )

  const totalSkills = useMemo(
    () => skills.reduce((sum, s) => sum + s.count, 0),
    [skills],
  )

  const totalAgents = useMemo(
    () => agents.reduce((sum, a) => sum + a.count, 0),
    [agents],
  )

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4">
      <h3 className="text-sm font-semibold text-gray-300">
        Skills & Agents
      </h3>
      <p className="mt-1 text-xs text-gray-500">
        Most used skills and agent types
      </p>

      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-medium text-gray-400">Top Skills</h4>
            {totalSkills > 0 && (
              <span className="text-[10px] text-gray-500">
                {totalSkills.toLocaleString()} total
              </span>
            )}
          </div>
          {skills.length === 0 ? (
            <EmptyColumn label="skills" />
          ) : (
            <div className="space-y-1">
              {skills.map((skill) => (
                <EntryRow
                  key={skill.name}
                  entry={skill}
                  badgeColor="#D97706"
                  barColor="#D97706"
                  prefix="/"
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-medium text-gray-400">Agent Types</h4>
            {totalAgents > 0 && (
              <span className="text-[10px] text-gray-500">
                {totalAgents.toLocaleString()} total
              </span>
            )}
          </div>
          {agents.length === 0 ? (
            <EmptyColumn label="agent" />
          ) : (
            <div className="space-y-1">
              {agents.map((agent) => (
                <EntryRow
                  key={agent.name}
                  entry={agent}
                  badgeColor="#6366F1"
                  barColor="#6366F1"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
