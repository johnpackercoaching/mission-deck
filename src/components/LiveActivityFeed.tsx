import { useState, useMemo } from 'react'
import { statusColors, phaseColors, statusLabels, getPhaseForAgent } from './TimelineView'
import { formatRelativeTime } from '../utils/relative-time'

export interface ActivityEvent {
  key: string
  teamId: string
  teamName: string
  agentName: string
  status: string
  fromStatus: string | null
  timestamp: number
  message?: string
}

interface LiveActivityFeedProps {
  events: ActivityEvent[]
}

const MAX_FEED_EVENTS = 50

const teamPillColors = [
  { bg: 'bg-violet-950/40', text: 'text-violet-300', border: 'border-violet-800/30' },
  { bg: 'bg-cyan-950/40', text: 'text-cyan-300', border: 'border-cyan-800/30' },
  { bg: 'bg-amber-950/40', text: 'text-amber-300', border: 'border-amber-800/30' },
  { bg: 'bg-emerald-950/40', text: 'text-emerald-300', border: 'border-emerald-800/30' },
  { bg: 'bg-rose-950/40', text: 'text-rose-300', border: 'border-rose-800/30' },
  { bg: 'bg-sky-950/40', text: 'text-sky-300', border: 'border-sky-800/30' },
]

function getTeamPillStyle(teamId: string) {
  let hash = 0
  for (let i = 0; i < teamId.length; i++) {
    hash = ((hash << 5) - hash + teamId.charCodeAt(i)) | 0
  }
  return teamPillColors[Math.abs(hash) % teamPillColors.length]!
}

export function LiveActivityFeed({ events }: LiveActivityFeedProps) {
  const [expanded, setExpanded] = useState(true)

  const displayEvents = useMemo(() => {
    return [...events]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_FEED_EVENTS)
  }, [events])

  return (
    <section
      className="space-y-2"
      aria-label="Live activity feed"
      data-testid="live-activity-feed"
    >
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="flex items-center gap-2 w-full text-left group"
        aria-expanded={expanded}
        aria-controls="activity-feed-events"
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
          Live Activity
        </h3>
        {displayEvents.length > 0 && (
          <span className="relative flex h-2 w-2 ml-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
        )}
        <span className="text-[10px] text-neutral-600 font-mono ml-auto">
          {displayEvents.length} {displayEvents.length === 1 ? 'event' : 'events'}
        </span>
      </button>

      {expanded && (
        <div
          id="activity-feed-events"
          role="log"
          aria-label="Cross-team activity events"
          aria-live="polite"
          className="max-h-64 overflow-y-auto bg-neutral-950 border border-neutral-800/60 rounded-lg p-2 space-y-0.5"
          data-testid="activity-feed-list"
        >
          {displayEvents.length === 0 ? (
            <div className="flex items-center justify-center h-16" data-testid="activity-feed-empty">
              <p className="text-sm text-neutral-600">No activity yet</p>
            </div>
          ) : (
            displayEvents.map(event => {
              const phase = getPhaseForAgent(event.agentName)
              const fromLabel = event.fromStatus ? statusLabels[event.fromStatus] ?? event.fromStatus : null
              const toLabel = statusLabels[event.status] ?? event.status
              const pillStyle = getTeamPillStyle(event.teamId)

              return (
                <div
                  key={event.key}
                  className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-white/[0.03] transition-colors duration-100 animate-fade-in"
                  data-testid="activity-feed-item"
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0 transition-colors duration-200"
                    style={{ backgroundColor: statusColors[event.status] ?? '#9ca3af' }}
                    aria-hidden="true"
                  />

                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 max-w-[80px] truncate ${pillStyle.bg} ${pillStyle.text} ${pillStyle.border}`}
                    title={event.teamName}
                    data-testid="activity-feed-team-name"
                  >
                    {event.teamName}
                  </span>

                  <div className="flex items-baseline gap-1.5 min-w-0 flex-1">
                    <span className="text-xs font-medium text-neutral-200 truncate">
                      {event.agentName}
                    </span>
                    <span
                      className="text-[10px] shrink-0"
                      style={{ color: phaseColors[phase] ?? '#6b7280' }}
                    >
                      {phase}
                    </span>
                  </div>

                  <span className="text-[10px] text-neutral-500 shrink-0 hidden sm:inline">
                    {fromLabel ? `${fromLabel} \u2192 ${toLabel}` : toLabel}
                  </span>

                  <span className="text-[10px] text-neutral-700 shrink-0 tabular-nums">
                    {formatRelativeTime(event.timestamp)}
                  </span>
                </div>
              )
            })
          )}
        </div>
      )}
    </section>
  )
}
