import { useState, useCallback } from 'react'
import { AGENTS } from '../config'
import type { AgentData } from '../schemas'
import { writeData } from '../services/data'

interface AgentRosterProps {
  teamId: string
  agents: Record<string, AgentData>
}

const statusIndicator: Record<string, string> = {
  idle: 'bg-neutral-600',
  active: 'bg-green-500',
  complete: 'bg-blue-500',
}

export function AgentRoster({ teamId, agents }: AgentRosterProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
        JP Rocks Agents
      </h3>
      <div className="space-y-2">
        {AGENTS.map((agentDef) => {
          const agentData = agents[agentDef.id]
          return (
            <AgentRow
              key={agentDef.id}
              teamId={teamId}
              agentId={agentDef.id}
              name={agentDef.name}
              phase={agentDef.phase}
              status={agentData?.status ?? 'idle'}
              systemPrompt={agentData?.systemPrompt ?? ''}
            />
          )
        })}
      </div>
    </div>
  )
}

interface AgentRowProps {
  teamId: string
  agentId: string
  name: string
  phase: string
  status: string
  systemPrompt: string
}

function AgentRow({ teamId, agentId, name, phase, status, systemPrompt }: AgentRowProps) {
  const [localPrompt, setLocalPrompt] = useState(systemPrompt)
  const [expanded, setExpanded] = useState(false)

  const handleSave = useCallback(async () => {
    await writeData(`teams/${teamId}/agents/${agentId}/systemPrompt`, localPrompt)
  }, [teamId, agentId, localPrompt])

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${statusIndicator[status] ?? statusIndicator.idle}`} />
        <span className="text-sm text-neutral-200 flex-1">{name}</span>
        <span className="text-xs text-neutral-500">{phase}</span>
        <span className="text-xs text-neutral-600">{status}</span>
      </div>
      {expanded && (
        <div className="mt-2">
          <textarea
            className="w-full bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-300 resize-y min-h-20 font-mono focus:outline-none focus:border-neutral-500"
            value={localPrompt}
            onChange={(e) => setLocalPrompt(e.target.value)}
            onBlur={() => void handleSave()}
            placeholder="System prompt..."
          />
        </div>
      )}
    </div>
  )
}
