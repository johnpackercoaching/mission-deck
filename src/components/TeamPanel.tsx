import { useData } from '../services/data'
import { TeamDataSchema } from '../schemas'
import { ProjectPreview } from './ProjectPreview'
import { Prompts } from './Prompts'
import { Terminal } from './Terminal'
import { Artifacts } from './Artifacts'
import { AgentRoster } from './AgentRoster'

interface TeamPanelProps {
  teamId: string
  teamName: string
}

export function TeamPanel({ teamId, teamName }: TeamPanelProps) {
  const { data, loading, error } = useData(`teams/${teamId}`, TeamDataSchema)

  if (loading) {
    return (
      <div className="bg-neutral-900/60 border border-neutral-800/60 rounded-xl p-5">
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
      <div className="bg-neutral-900/60 border border-red-900/40 rounded-xl p-5" role="alert">
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

  return (
    <div
      className="group bg-neutral-900/60 border border-neutral-800/60 rounded-xl overflow-hidden hover:border-neutral-700/60 transition-colors duration-200"
      data-testid={`team-panel-${teamId}`}
    >
      {/* Header with accent top border */}
      <div className="border-b border-neutral-800/40 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {activeAgentCount > 0 ? (
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot" aria-label="Agents active" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-neutral-600" aria-label="Agents idle" />
            )}
            <h2 className="text-lg font-semibold text-neutral-100">{name || teamName}</h2>
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
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
          <div className="space-y-5">
            <ProjectPreview previewUrl={project.previewUrl ?? ''} />
            <Prompts teamId={teamId} prompts={project.prompts ?? {}} />
            <Terminal lines={terminal.lines ?? {}} />
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
