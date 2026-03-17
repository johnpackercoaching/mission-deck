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
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-neutral-200 mb-3">{teamName}</h2>
        <p className="text-sm text-neutral-500">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-neutral-900/50 border border-red-900 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-neutral-200 mb-3">{teamName}</h2>
        <p className="text-sm text-red-400">Error: {error}</p>
      </div>
    )
  }

  const project = data?.project ?? { previewUrl: '', prompts: {} }
  const terminal = data?.terminal ?? { lines: {} }
  const artifacts = data?.artifacts ?? {}
  const agents = data?.agents ?? {}
  const name = data?.name ?? teamName

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4 space-y-4" data-testid={`team-panel-${teamId}`}>
      <h2 className="text-lg font-semibold text-neutral-200">{name || teamName}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <div className="space-y-4">
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
  )
}
