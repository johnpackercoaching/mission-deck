import { useState, useMemo } from 'react'
import { z } from 'zod'
import { useData } from '../services/data'
import { TimelineEventSchema } from '../schemas'
import { AGENTS } from '../config'
import { formatRelativeTime } from '../utils/relative-time'
import { TimelineFilter, getTimeRangeMs } from './TimelineFilter'
import type { TimeRange } from './TimelineFilter'

interface TimelineViewProps {
  teamId: string
}

const MAX_DISPLAY_EVENTS = 200

export const statusColors: Record<string, string> = {
  idle: '#9ca3af',
  active: '#34d399',
  complete: '#38bdf8',
  error: '#f87171',
}

export const statusLabels: Record<string, string> = {
  idle: 'Idle',
  active: 'Active',
  complete: 'Complete',
  error: 'Error',
}

export const phaseColors: Record<string, string> = {
  Orientation: '#9ca3af',
  Direction: '#a78bfa',
  'Product Scoping': '#f472b6',
  Planning: '#fb923c',
  Validation: '#facc15',
  Diagnostics: '#f87171',
  Implementation: '#34d399',
  Verification: '#38bdf8',
}

export function getPhaseForAgent(agentName: string): string {
  const agent = AGENTS.find((a) => a.id === agentName || a.name === agentName)
  return agent?.phase ?? 'Other'
}

function groupByPhase<T extends { agentName: string }>(events: T[]) {
  const phaseOrder = AGENTS.map((a) => a.phase)
  const groups = new Map<string, T[]>()

  for (const event of events) {
    const phase = getPhaseForAgent(event.agentName)
    const existing = groups.get(phase) ?? []
    existing.push(event)
    groups.set(phase, existing)
  }

  return [...groups.entries()].sort((a, b) => {
    const ai = phaseOrder.indexOf(a[0])
    const bi = phaseOrder.indexOf(b[0])
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })
}

export function TimelineView({ teamId }: TimelineViewProps) {
  const [expanded, setExpanded] = useState(true)
  const [range, setRange] = useState<TimeRange>('all')
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)

  const { data: timeline } = useData(
    `teams/${teamId}/timeline`,
    z.record(z.string(), TimelineEventSchema),
  )

  const events = useMemo(() => {
    if (!timeline) return []
    const cutoff = range === 'all' ? 0 : Date.now() - getTimeRangeMs(range)
    return Object.entries(timeline)
      .map(([key, event]) => ({ key, ...event }))
      .filter((e) => e.timestamp >= cutoff)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_DISPLAY_EVENTS)
  }, [timeline, range])

  const phaseGroups = useMemo(() => groupByPhase(events), [events])

  return (
    <section className="space-y-2" aria-label="Agent timeline" data-testid="timeline-section">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center gap-2 w-full text-left group"
        aria-expanded={expanded}
        aria-controls="timeline-events"
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
        <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Timeline</h3>
        {events.length > 0 && (
          <span className="text-[10px] text-neutral-600 font-mono ml-auto">
            {events.length} {events.length === 1 ? 'event' : 'events'}
          </span>
        )}
      </button>

      {expanded && (
        <div id="timeline-events" className="space-y-3" data-testid="timeline-event-list">
          <TimelineFilter
            selectedRange={range}
            onRangeChange={setRange}
            eventCount={events.length}
          />

          <div
            role="log"
            aria-label="Agent timeline events"
            aria-live="polite"
            className="max-h-80 overflow-y-auto bg-neutral-950 border border-neutral-800/60 rounded-lg p-3 space-y-0.5"
          >
            {events.length === 0 ? (
              <div className="flex items-center justify-center h-16" data-testid="timeline-empty">
                <p className="text-sm text-neutral-600">No timeline events yet</p>
              </div>
            ) : (
              phaseGroups.map(([phase, phaseEvents]) => (
                <div key={phase} className="mb-3 last:mb-0">
                  <div className="flex items-center gap-2 mb-1.5 pl-1">
                    <div
                      className="w-1 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: phaseColors[phase] ?? '#6b7280' }}
                      aria-hidden="true"
                    />
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: phaseColors[phase] ?? '#6b7280' }}
                      data-testid="timeline-phase-header"
                    >
                      {phase}
                    </span>
                    <span className="text-[10px] text-neutral-700 font-mono">
                      {phaseEvents.length}
                    </span>
                  </div>
                  <div className="border-l border-neutral-800/40 ml-1.5 pl-2 space-y-0.5">
                    {phaseEvents.map((event) => {
                      const fromLabel = event.fromStatus ? statusLabels[event.fromStatus] ?? event.fromStatus : null
                      const toLabel = statusLabels[event.status] ?? event.status
                      const isOpen = expandedEvent === event.key

                      return (
                        <div key={event.key} className="timeline-event-in" data-testid="timeline-event">
                          <button
                            type="button"
                            onClick={() => setExpandedEvent((prev) => (prev === event.key ? null : event.key))}
                            aria-expanded={isOpen}
                            className="focus-ring w-full flex items-start gap-2.5 py-1.5 px-2 -mx-1 rounded hover:bg-white/[0.03] transition-colors duration-100 text-left"
                          >
                            <div
                              className="w-2 h-2 rounded-full mt-1.5 shrink-0 transition-colors duration-200"
                              style={{ backgroundColor: statusColors[event.status] ?? '#9ca3af' }}
                              aria-hidden="true"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2">
                                <span className="text-xs font-medium text-neutral-200 truncate">
                                  {event.agentName}
                                </span>
                                <span className="text-[10px] text-neutral-600 shrink-0">
                                  {getPhaseForAgent(event.agentName)}
                                </span>
                              </div>
                              <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span className="text-[10px] text-neutral-500">
                                  {fromLabel ? `${fromLabel} \u2192 ${toLabel}` : toLabel}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] text-neutral-700 shrink-0 select-none tabular-nums">
                              {formatRelativeTime(event.timestamp)}
                            </span>
                          </button>
                          {isOpen && event.message && (
                            <div className="pl-7 pb-2 pr-2 animate-fade-in">
                              <p className="text-[11px] text-neutral-400 bg-neutral-900/50 rounded px-2 py-1.5 border border-neutral-800/40">
                                {event.message}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  )
}
