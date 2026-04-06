import { AGENTS } from '../config'
import type { AgentData } from '../schemas'

interface WaterfallProgressProps {
  agents: Record<string, AgentData>
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

type PhaseStatus = 'idle' | 'active' | 'complete' | 'error'

function getPhaseStatus(agentId: string, agents: Record<string, AgentData>): PhaseStatus {
  const agent = agents[agentId]
  if (!agent) return 'idle'
  return agent.status
}

function getStatusLabel(phases: { phase: string; status: PhaseStatus }[]): string {
  const activePhase = phases.find((p) => p.status === 'active')
  if (activePhase) return `Running: ${activePhase.phase}`

  const errorPhase = phases.find((p) => p.status === 'error')
  if (errorPhase) return `Error: ${errorPhase.phase}`

  const completeCount = phases.filter((p) => p.status === 'complete').length
  if (completeCount > 0) return `${completeCount}/${phases.length} phases complete`

  return 'Idle'
}

export function WaterfallProgress({ agents }: WaterfallProgressProps) {
  const phases = AGENTS.map((agent) => ({
    id: agent.id,
    phase: agent.phase,
    color: phaseColors[agent.phase] ?? '#6b7280',
    status: getPhaseStatus(agent.id, agents),
  }))

  const completeCount = phases.filter((p) => p.status === 'complete').length

  return (
    <div
      className="flex items-center gap-1 px-3 sm:px-5 py-2 border-b border-neutral-800/40 bg-neutral-950/30"
      data-testid="waterfall-progress"
      role="progressbar"
      aria-label="Waterfall phase progress"
      aria-valuenow={completeCount}
      aria-valuemin={0}
      aria-valuemax={8}
    >
      <div className="flex items-center gap-px sm:gap-0.5 flex-1 min-w-0">
        {phases.map((phase, i) => (
          <div key={phase.id} className="flex items-center">
            <div
              className={`w-2.5 h-2.5 rounded-full border-2 transition-colors duration-200 ${
                phase.status === 'active' ? 'animate-pulse-dot' : ''
              }`}
              style={{
                borderColor: phase.status === 'error' ? '#ef4444' : phase.color,
                backgroundColor:
                  phase.status === 'complete' || phase.status === 'active'
                    ? phase.color
                    : phase.status === 'error'
                      ? '#ef4444'
                      : 'transparent',
              }}
              title={`${phase.phase}: ${phase.status}`}
              aria-hidden="true"
            />
            {i < phases.length - 1 && (
              <div
                className="w-1.5 sm:w-3 h-0.5 transition-colors duration-200"
                style={{
                  backgroundColor: phase.status === 'complete' ? phase.color : '#404040',
                }}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>
      <span className="hidden sm:inline text-[10px] text-neutral-500 font-mono shrink-0 ml-2">
        {getStatusLabel(phases)}
      </span>
    </div>
  )
}
