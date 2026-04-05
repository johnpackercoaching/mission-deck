import { useState, useMemo } from 'react'
import { z } from 'zod'
import { useData } from '../services/data'
import { TimelineEventSchema } from '../schemas'
import { AGENTS } from '../config'

interface AgentMetricsProps {
  teamId: string
}

const phaseColors: Record<string, string> = {
  Orientation: '#9ca3af',
  Direction: '#a78bfa',
  'Product Scoping': '#f472b6',
  Planning: '#fb923c',
  Validation: '#facc15',
  Diagnostics: '#f87171',
  Implementation: '#34d399',
  Verification: '#38bdf8',
}

interface AgentMetric {
  agentId: string
  agentName: string
  phase: string
  avgDurationMs: number
  errorCount: number
  completeCount: number
  color: string
}

function computeMetrics(
  timeline: Record<string, { agentName: string; status: string; timestamp: number }> | null,
): AgentMetric[] {
  if (!timeline) return []

  const events = Object.values(timeline).sort((a, b) => a.timestamp - b.timestamp)
  const agentDurations = new Map<string, number[]>()
  const agentErrors = new Map<string, number>()
  const agentCompletes = new Map<string, number>()
  const activeTimestamps = new Map<string, number>()

  for (const event of events) {
    const name = event.agentName
    if (event.status === 'active') {
      activeTimestamps.set(name, event.timestamp)
    }
    if (event.status === 'complete') {
      agentCompletes.set(name, (agentCompletes.get(name) ?? 0) + 1)
      const start = activeTimestamps.get(name)
      if (start) {
        const durations = agentDurations.get(name) ?? []
        durations.push(event.timestamp - start)
        agentDurations.set(name, durations)
        activeTimestamps.delete(name)
      }
    }
    if (event.status === 'error') {
      agentErrors.set(name, (agentErrors.get(name) ?? 0) + 1)
    }
  }

  return AGENTS.filter((agent) => {
    const name = agent.id
    return (
      agentDurations.has(name) ||
      agentErrors.has(name) ||
      agentCompletes.has(name)
    )
  }).map((agent) => {
    const durations = agentDurations.get(agent.id) ?? []
    const avg =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0
    return {
      agentId: agent.id,
      agentName: agent.name,
      phase: agent.phase,
      avgDurationMs: avg,
      errorCount: agentErrors.get(agent.id) ?? 0,
      completeCount: agentCompletes.get(agent.id) ?? 0,
      color: phaseColors[agent.phase] ?? '#6b7280',
    }
  })
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(1)}s`
  const m = Math.floor(s / 60)
  const rem = Math.round(s % 60)
  return `${m}m ${rem}s`
}

const BAR_WIDTH = 160

export function AgentMetrics({ teamId }: AgentMetricsProps) {
  const [expanded, setExpanded] = useState(false)

  const { data: timeline } = useData(
    `teams/${teamId}/timeline`,
    z.record(z.string(), TimelineEventSchema),
  )

  const metrics = useMemo(() => computeMetrics(timeline), [timeline])
  const maxDuration = useMemo(
    () => Math.max(...metrics.map((m) => m.avgDurationMs), 1),
    [metrics],
  )

  return (
    <section
      className="space-y-2 px-5 py-3 border-b border-neutral-800/40"
      aria-label="Agent performance metrics"
      data-testid="agent-metrics"
    >
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center gap-2 w-full text-left group"
        aria-expanded={expanded}
        aria-controls="agent-metrics-content"
      >
        <svg
          className={`w-3 h-3 text-neutral-500 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
          Metrics
        </h3>
        {metrics.length > 0 && (
          <span className="text-[10px] text-neutral-600 font-mono ml-auto">
            {metrics.length} {metrics.length === 1 ? 'agent' : 'agents'}
          </span>
        )}
      </button>

      {expanded && (
        <div
          id="agent-metrics-content"
          className="bg-neutral-950 border border-neutral-800/60 rounded-lg p-3 space-y-2"
        >
          {metrics.length === 0 ? (
            <div className="flex items-center justify-center h-12">
              <p className="text-sm text-neutral-600" data-testid="agent-metrics-empty">
                No metrics data yet
              </p>
            </div>
          ) : (
            <div className="space-y-1.5" role="list" aria-label="Agent performance bars">
              {metrics.map((m) => {
                const barW =
                  maxDuration > 0
                    ? (m.avgDurationMs / maxDuration) * BAR_WIDTH
                    : 0

                return (
                  <div
                    key={m.agentId}
                    className="flex items-center gap-3 py-1"
                    data-testid="agent-metric-row"
                    role="listitem"
                  >
                    <span className="text-[11px] text-neutral-400 w-24 truncate shrink-0">
                      {m.agentName}
                    </span>
                    <svg
                      width={BAR_WIDTH}
                      height={14}
                      className="shrink-0"
                      role="img"
                      aria-label={`${m.agentName}: average ${formatDuration(m.avgDurationMs)}`}
                    >
                      <rect
                        x={0}
                        y={2}
                        width={Math.max(barW, 2)}
                        height={10}
                        rx={3}
                        fill={m.color}
                        opacity={0.7}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <span className="text-[10px] text-neutral-500 font-mono tabular-nums shrink-0 w-14 text-right">
                      {m.avgDurationMs > 0 ? formatDuration(m.avgDurationMs) : '--'}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {m.completeCount > 0 && (
                        <span className="text-[10px] text-green-400 font-mono">
                          {m.completeCount}ok
                        </span>
                      )}
                      {m.errorCount > 0 && (
                        <span className="text-[10px] text-red-400 font-mono">
                          {m.errorCount}err
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
