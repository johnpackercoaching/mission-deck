import { useData } from '../services/data'
import { TeamDataSchema } from '../schemas'
import { ProjectPreview } from './ProjectPreview'
import { Prompts } from './Prompts'
import { Terminal } from './Terminal'
import { TimelineView } from './TimelineView'
import { Artifacts } from './Artifacts'
import { AgentRoster } from './AgentRoster'
import { WaterfallProgress } from './WaterfallProgress'
import { AgentMetrics } from './AgentMetrics'

interface TeamPanelProps {
  teamId: string
  teamName: string
  onClick?: () => void
}

export function TeamPanel({ teamId, teamName, onClick }: TeamPanelProps) {
  const { data, loading, error } = useData(`teams/${teamId}`, TeamDataSchema)

  if (loading) {
    return (
      <div className="bg-neutral-900/60 border border-neutral-800/60 rounded-xl p-3 sm:p-5" data-testid={`team-panel-${teamId}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 rounded-full bg-neutral-600 animate-pulse-dot" />
          <h2 className="text-lg font-semibold text-neutral-200">{teamName}</h2>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-3/4 bg-neutral-800/50 rounded animate-shimmer" />
          <div className="h-4 w-1/2 bg-neutral-800/50 rounded animate-shimmer" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-neutral-900/60 border border-red-900/40 rounded-xl p-3 sm:p-5" data-testid={`team-panel-${teamId}`} role="alert">
        <h2 className="text-lg font-semibold text-neutral-200 mb-2">{teamName}</h2>
        <p className="text-sm text-red-400 bg-red-950/20 rounded-lg px-3 py-2">
          Failed to load: {error}
        </p>
      </div>
    )
  }

  const project = data?.project ?? { previewUrl: '', prompts: {} }
  const terminal = data?.terminal ?? { lines: {} }
  const artifacts = data?.artifacts ?? {}
  const agents = data?.agents ?? {}
  const name = data?.name ?? teamName

  const activeAgentCount = Object.values(agents).filter(a => a.status === 'active').length
  const completeAgentCount = Object.values(agents).filter(a => a.status === 'complete').length
  const errorAgentCount = Object.values(agents).filter(a => a.status === 'error').length

  return (
    <div
      className="group bg-neutral-900/60 border border-neutral-800/60 rounded-xl overflow-hidden hover:border-neutral-700/60 transition-colors duration-200"
      data-testid={`team-panel-${teamId}`}
    >
      {/* Header with accent top border */}
      <div
        className={`border-b border-neutral-800/40 px-3 sm:px-5 py-3 sm:py-4 ${onClick ? 'cursor-pointer hover:bg-neutral-800/30 transition-colors duration-150' : ''}`}
        onClick={onClick}
        onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-label={onClick ? `View details for ${name || teamName}` : undefined}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {activeAgentCount > 0 ? (
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot" aria-label="Agents active" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-neutral-600" aria-label="Agents idle" />
            )}
            <h2 className="text-lg font-semibold text-neutral-100">{name || teamName}</h2>
            {onClick && (
              <svg
                className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors duration-150"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            {activeAgentCount > 0 && (
              <span className="bg-green-950/40 text-green-400 border border-green-900/30 rounded-full px-2 py-0.5">
                {activeAgentCount} active
              </span>
            )}
            {completeAgentCount > 0 && (
              <span className="bg-blue-950/30 text-blue-400 border border-blue-900/30 rounded-full px-2 py-0.5">
                {completeAgentCount} done
              </span>
            )}
            {errorAgentCount > 0 && (
              <span className="bg-red-950/30 text-red-400 border border-red-900/30 rounded-full px-2 py-0.5">
                {errorAgentCount} error
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Waterfall Progress */}
      <WaterfallProgress agents={agents} />

      {/* Agent Metrics */}
      <AgentMetrics teamId={teamId} />

      {/* Content */}
      <div className="p-3 sm:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3 sm:gap-5">
          <div className="space-y-3 sm:space-y-5">
            <ProjectPreview previewUrl={project.previewUrl ?? ''} />
            <Prompts teamId={teamId} prompts={project.prompts ?? {}} />
            <Terminal lines={terminal.lines ?? {}} />
            <TimelineView teamId={teamId} />
            <Artifacts artifacts={artifacts} />
          </div>
          <div>
            <AgentRoster teamId={teamId} agents={agents} />
          </div>
        </div>
      </div>
    </div>
  )
}
