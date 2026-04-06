import { useCallback } from 'react'

interface TeamTab {
  id: string
  name: string
  status: 'active' | 'error' | 'idle'
}

interface TeamSelectorProps {
  teams: TeamTab[]
  focusedTeamId: string | null
  onSelectTeam: (teamId: string | null) => void
  onCreateTeam: () => void
  onDeleteTeam: (teamId: string, teamName: string) => void
  canCreate: boolean
}

const statusDotColor: Record<string, string> = {
  active: 'bg-green-500 animate-pulse-dot',
  error: 'bg-red-500',
  idle: 'bg-neutral-600',
}

export function TeamSelector({ teams, focusedTeamId, onSelectTeam, onCreateTeam, onDeleteTeam, canCreate }: TeamSelectorProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, teamId: string | null) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onSelectTeam(teamId)
      }
    },
    [onSelectTeam]
  )

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent, teamId: string, teamName: string) => {
      e.stopPropagation()
      onDeleteTeam(teamId, teamName)
    },
    [onDeleteTeam]
  )

  const isAllSelected = focusedTeamId === null

  return (
    <div
      className="flex items-center gap-1 overflow-x-auto py-1 -mx-1 px-1"
      role="tablist"
      aria-label="Select team to monitor"
    >
      {/* All Teams tab */}
      <button
        role="tab"
        aria-selected={isAllSelected}
        aria-controls="team-content"
        onClick={() => onSelectTeam(null)}
        onKeyDown={(e) => handleKeyDown(e, null)}
        className={`focus-ring shrink-0 flex items-center gap-2 text-sm font-medium px-3 py-1.5 min-h-[44px] rounded-lg transition-all duration-150 ${
          isAllSelected
            ? 'bg-accent-500/15 text-accent-400 border border-accent-500/30'
            : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/40 border border-transparent'
        }`}
        data-testid="team-tab-all"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
          />
        </svg>
        All
        <span className="text-xs opacity-60">{teams.length}</span>
      </button>

      {/* Separator */}
      <div className="w-px h-5 bg-neutral-800/60 shrink-0 mx-0.5" aria-hidden="true" />

      {/* Individual team tabs */}
      {teams.map((team) => {
        const isSelected = focusedTeamId === team.id
        return (
          <button
            key={team.id}
            role="tab"
            aria-selected={isSelected}
            aria-controls="team-content"
            onClick={() => onSelectTeam(team.id)}
            onKeyDown={(e) => handleKeyDown(e, team.id)}
            className={`group/tab focus-ring shrink-0 flex items-center gap-2 text-sm font-medium px-3 py-1.5 min-h-[44px] rounded-lg transition-all duration-150 ${
              isSelected
                ? 'bg-accent-500/15 text-accent-400 border border-accent-500/30'
                : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/40 border border-transparent'
            }`}
            data-testid={`team-tab-${team.id}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDotColor[team.status] ?? 'bg-neutral-600'}`}
              aria-label={`Status: ${team.status}`}
            />
            <span className="truncate max-w-32">{team.name}</span>
            {/* Delete button - hover reveal */}
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => handleDeleteClick(e, team.id, team.name)}
              className="opacity-0 group-hover/tab:opacity-100 focus:opacity-100 ml-0.5 -mr-1 p-0.5 rounded text-neutral-600 hover:text-red-400 transition-all duration-150"
              aria-label={`Delete team ${team.name}`}
              data-testid={`delete-team-${team.id}`}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          </button>
        )
      })}

      {/* Create Team button */}
      {canCreate && (
        <>
          <div className="w-px h-5 bg-neutral-800/60 shrink-0 mx-0.5" aria-hidden="true" />
          <button
            onClick={onCreateTeam}
            className="focus-ring shrink-0 flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 min-h-[44px] rounded-lg text-neutral-500 hover:text-accent-400 hover:bg-neutral-800/40 border border-transparent hover:border-accent-500/20 transition-all duration-150"
            aria-label="Create new team"
            data-testid="create-team-button"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New
          </button>
        </>
      )}
    </div>
  )
}
