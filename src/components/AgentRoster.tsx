import { useState, useCallback, useEffect } from 'react'
import { AGENTS } from '../config'
import type { AgentId } from '../config'
import type { AgentData } from '../schemas'
import { writeData } from '../services/data'
import { useRelativeTime } from '../utils/relative-time'
import {
  PROJECT_RESUME_AGENT_PROMPT,
  NEXT_STEPS_AGENT_PROMPT,
  PRODUCT_MANAGER_AGENT_PROMPT,
  PLAN_BUILDER_AGENT_PROMPT,
  PLAN_VALIDATION_AGENT_PROMPT,
  BLOCKER_ANALYSIS_AGENT_PROMPT,
  EXECUTION_AGENT_PROMPT,
  PLAYWRIGHT_TEST_AGENT_PROMPT,
} from '../data/agent-prompts'

const DEFAULT_PROMPTS: Record<AgentId, string> = {
  'project-resume-agent': PROJECT_RESUME_AGENT_PROMPT,
  'next-steps-agent': NEXT_STEPS_AGENT_PROMPT,
  'product-manager-agent': PRODUCT_MANAGER_AGENT_PROMPT,
  'plan-builder-agent': PLAN_BUILDER_AGENT_PROMPT,
  'plan-validation-agent': PLAN_VALIDATION_AGENT_PROMPT,
  'blocker-analysis-agent': BLOCKER_ANALYSIS_AGENT_PROMPT,
  'execution-agent': EXECUTION_AGENT_PROMPT,
  'playwright-test-agent': PLAYWRIGHT_TEST_AGENT_PROMPT,
}

interface AgentRosterProps {
  teamId: string
  agents: Record<string, AgentData>
}

const statusStyles: Record<string, { dot: string; label: string; badge: string }> = {
  idle: {
    dot: 'bg-neutral-600',
    label: 'idle',
    badge: 'text-neutral-500',
  },
  active: {
    dot: 'bg-green-500 animate-pulse-dot',
    label: 'active',
    badge: 'text-green-400',
  },
  complete: {
    dot: 'bg-blue-500',
    label: 'done',
    badge: 'text-blue-400',
  },
  error: {
    dot: 'bg-red-500',
    label: 'error',
    badge: 'text-red-400',
  },
}

export function AgentRoster({ teamId, agents }: AgentRosterProps) {
  return (
    <section className="space-y-3" aria-label="Agent roster">
      <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
        JP Rocks Agents
      </h3>
      <div className="space-y-1.5" role="list">
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
              systemPrompt={agentData?.systemPrompt || DEFAULT_PROMPTS[agentDef.id]}
              lastActivity={agentData?.lastActivity}
            />
          )
        })}
      </div>
    </section>
  )
}

interface AgentRowProps {
  teamId: string
  agentId: string
  name: string
  phase: string
  status: string
  systemPrompt: string
  lastActivity?: number
}

function AgentRow({ teamId, agentId, name, phase, status, systemPrompt, lastActivity }: AgentRowProps) {
  const relativeTime = useRelativeTime(lastActivity)
  const [localPrompt, setLocalPrompt] = useState(systemPrompt)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setLocalPrompt(systemPrompt)
  }, [systemPrompt])

  const handleSave = useCallback(async () => {
    await writeData(`teams/${teamId}/agents/${agentId}/systemPrompt`, localPrompt)
  }, [teamId, agentId, localPrompt])

  const defaultStyle = { dot: 'bg-neutral-600', label: 'idle', badge: 'text-neutral-500' }
  const style = statusStyles[status] ?? defaultStyle

  return (
    <div
      className="bg-neutral-900/80 border border-neutral-800/50 rounded-lg overflow-hidden hover:border-neutral-700/50 transition-colors duration-150"
      role="listitem"
    >
      <button
        className="focus-ring w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={`prompt-${agentId}`}
      >
        <span
          className={`w-2 h-2 rounded-full shrink-0 transition-colors duration-200 ${style.dot}`}
          aria-label={`Status: ${style.label}`}
        />
        <span className="text-sm text-neutral-200 flex-1 truncate">{name}</span>
        <span className="text-[10px] text-neutral-600 hidden sm:inline">{phase}</span>
        <span className={`text-[10px] font-medium ${style.badge}`}>{style.label}</span>
        {relativeTime && (
          <span className="text-[10px] text-neutral-600 hidden sm:inline">{relativeTime}</span>
        )}
        <svg
          className={`w-3 h-3 text-neutral-600 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      <div
        id={`prompt-${agentId}`}
        className={`overflow-hidden transition-all duration-200 ${expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-3 pb-3 pt-1">
          <label htmlFor={`textarea-${agentId}`} className="sr-only">
            System prompt for {name}
          </label>
          <textarea
            id={`textarea-${agentId}`}
            className="focus-ring w-full bg-neutral-950 border border-neutral-800/60 rounded-md px-2.5 py-2 text-xs text-neutral-300 resize-y min-h-20 font-mono focus:border-accent-500/50 transition-colors duration-150 placeholder:text-neutral-700"
            value={localPrompt}
            onChange={(e) => setLocalPrompt(e.target.value)}
            onBlur={() => void handleSave()}
            placeholder="Enter system prompt..."
          />
        </div>
      </div>
    </div>
  )
}
