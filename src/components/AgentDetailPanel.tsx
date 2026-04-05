import { useMemo } from 'react'
import { z } from 'zod'
import { useData } from '../services/data'
import { TimelineEventSchema } from '../schemas'
import { formatRelativeTime } from '../utils/relative-time'

interface AgentDetailPanelProps {
  agentId: string
  agentName: string
  phase: string
  status: string
  teamId: string
  onClose: () => void
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

const statusDotColors: Record<string, string> = {
  idle: '#737373',
  active: '#22c55e',
  complete: '#38bdf8',
  error: '#ef4444',
}

const MAX_EVENTS = 50

export function AgentDetailPanel({ agentId, agentName, phase, status, teamId, onClose }: AgentDetailPanelProps) {
  const { data: timeline } = useData(
    `teams/${teamId}/timeline`,
    z.record(z.string(), TimelineEventSchema),
  )

  const agentEvents = useMemo(() => {
    if (!timeline) return []
    return Object.entries(timeline)
      .filter(([, event]) => event.agentName === agentId)
      .map(([key, event]) => ({ key, ...event }))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_EVENTS)
  }, [timeline, agentId])

  const stats = useMemo(() => {
    let activations = 0
    let completions = 0
    let errors = 0
    const durations: number[] = []
    const activeTimestamps = new Map<string, number>()

    if (!timeline) return { activations, completions, errors, avgDuration: 0 }

    const sorted = Object.values(timeline)
      .filter((e) => e.agentName === agentId)
      .sort((a, b) => a.timestamp - b.timestamp)

    for (const event of sorted) {
      if (event.status === 'active') {
        activations++
        activeTimestamps.set(event.agentName, event.timestamp)
      }
      if (event.status === 'complete') {
        completions++
        const start = activeTimestamps.get(event.agentName)
        if (start) {
          durations.push(event.timestamp - start)
          activeTimestamps.delete(event.agentName)
        }
      }
      if (event.status === 'error') {
        errors++
      }
    }

    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0

    return { activations, completions, errors, avgDuration }
  }, [timeline, agentId])

  const accentColor = phaseColors[phase] ?? '#6b7280'

  function formatDuration(ms: number): string {
    if (ms === 0) return '--'
    if (ms < 1000) return `${Math.round(ms)}ms`
    const s = ms / 1000
    if (s < 60) return `${s.toFixed(1)}s`
    const m = Math.floor(s / 60)
    const rem = Math.round(s % 60)
    return `${m}m ${rem}s`
  }

  return (
    <div
      className="agent-detail-enter bg-neutral-950 border border-neutral-800/60 rounded-lg overflow-hidden"
      style={{ borderLeftColor: accentColor, borderLeftWidth: 3 }}
      role="region"
      aria-label={`Agent detail for ${agentName}`}
      data-testid="agent-detail-panel"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-neutral-800/40">
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: statusDotColors[status] ?? '#737373' }}
        />
        <span className="text-sm font-medium text-neutral-200 flex-1 truncate" data-testid="agent-detail-name">
          {agentName}
        </span>
        <span className="text-[10px] font-medium" style={{ color: accentColor }}>
          {phase}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="focus-ring w-5 h-5 flex items-center justify-center rounded text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors duration-150"
          aria-label="Close agent detail"
          data-testid="agent-detail-close"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>

      {/* Stats */}
      <div
        className="grid grid-cols-4 gap-px bg-neutral-800/30 border-b border-neutral-800/40"
        data-testid="agent-detail-stats"
      >
        {[
          { label: 'Activations', value: stats.activations },
          { label: 'Completions', value: stats.completions },
          { label: 'Errors', value: stats.errors, isError: stats.errors > 0 },
          { label: 'Avg Duration', value: formatDuration(stats.avgDuration), isText: true },
        ].map((stat) => (
          <div key={stat.label} className="bg-neutral-950 px-3 py-2 text-center">
            <div className={`text-sm font-semibold tabular-nums ${stat.isError ? 'text-red-400' : 'text-neutral-200'}`}>
              {stat.isText ? stat.value : String(stat.value)}
            </div>
            <div className="text-[9px] text-neutral-600 uppercase tracking-wider mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Event Log */}
      <div className="max-h-48 overflow-y-auto px-3 py-2 space-y-0.5" data-testid="agent-detail-events">
        {agentEvents.length === 0 ? (
          <p className="text-xs text-neutral-600 text-center py-3">No activity recorded</p>
        ) : (
          agentEvents.map((event) => (
            <div
              key={event.key}
              className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-white/[0.02] transition-colors duration-100"
            >
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: statusDotColors[event.status] ?? '#737373' }}
              />
              <span className="text-[11px] text-neutral-400 flex-1">
                {event.fromStatus ? `${event.fromStatus} \u2192 ${event.status}` : event.status}
              </span>
              {event.message && (
                <span className="text-[10px] text-neutral-600 truncate max-w-32">{event.message}</span>
              )}
              <span className="text-[10px] text-neutral-700 shrink-0 tabular-nums">
                {formatRelativeTime(event.timestamp)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
