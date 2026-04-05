import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'

interface CommandAction {
  id: string
  label: string
  description: string
  icon: 'team' | 'grid' | 'create' | 'filter'
  onSelect: () => void
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  teams: Array<{ id: string; name: string; status: 'active' | 'error' | 'idle' }>
  focusedTeamId: string | null
  onSelectTeam: (teamId: string | null) => void
  onCreateTeam: () => void
  onSetStatusFilter: (filter: 'all' | 'active' | 'error' | 'idle') => void
}

const STATUS_DOT_COLORS: Record<string, string> = {
  active: 'bg-green-500',
  error: 'bg-red-500',
  idle: 'bg-neutral-600',
}

export function CommandPalette({
  isOpen,
  onClose,
  teams,
  focusedTeamId,
  onSelectTeam,
  onCreateTeam,
  onSetStatusFilter,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const actions: CommandAction[] = useMemo(() => {
    const items: CommandAction[] = []

    if (focusedTeamId !== null) {
      items.push({
        id: 'view-all',
        label: 'View All Teams',
        description: 'Return to grid view',
        icon: 'grid',
        onSelect: () => { onSelectTeam(null); onClose() },
      })
    }

    for (const team of teams) {
      if (team.id === focusedTeamId) continue
      items.push({
        id: `team-${team.id}`,
        label: `Switch to ${team.name}`,
        description: `Status: ${team.status}`,
        icon: 'team',
        onSelect: () => { onSelectTeam(team.id); onClose() },
      })
    }

    items.push({
      id: 'create-team',
      label: 'Create New Team',
      description: 'Add a new team to the dashboard',
      icon: 'create',
      onSelect: () => { onCreateTeam(); onClose() },
    })

    items.push(
      {
        id: 'filter-active',
        label: 'Filter: Active Teams',
        description: 'Show only active teams',
        icon: 'filter',
        onSelect: () => { onSelectTeam(null); onSetStatusFilter('active'); onClose() },
      },
      {
        id: 'filter-error',
        label: 'Filter: Error Teams',
        description: 'Show only teams with errors',
        icon: 'filter',
        onSelect: () => { onSelectTeam(null); onSetStatusFilter('error'); onClose() },
      },
      {
        id: 'filter-idle',
        label: 'Filter: Idle Teams',
        description: 'Show only idle teams',
        icon: 'filter',
        onSelect: () => { onSelectTeam(null); onSetStatusFilter('idle'); onClose() },
      },
      {
        id: 'filter-all',
        label: 'Show All Teams',
        description: 'Remove status filter',
        icon: 'filter',
        onSelect: () => { onSelectTeam(null); onSetStatusFilter('all'); onClose() },
      },
    )

    return items
  }, [teams, focusedTeamId, onSelectTeam, onCreateTeam, onSetStatusFilter, onClose])

  const filteredActions = useMemo(() => {
    if (!query.trim()) return actions
    const q = query.trim().toLowerCase()
    return actions.filter(a =>
      a.label.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q)
    )
  }, [actions, query])

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      previousFocusRef.current = document.activeElement as HTMLElement
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    const timer = setTimeout(() => inputRef.current?.focus(), 50)

    function handleGlobalKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handleGlobalKeyDown)

    return () => {
      clearTimeout(timer)
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleGlobalKeyDown)
      previousFocusRef.current?.focus()
    }
  }, [isOpen, onClose])

  useEffect(() => {
    setSelectedIndex(prev => Math.min(prev, Math.max(0, filteredActions.length - 1)))
  }, [filteredActions.length])

  useEffect(() => {
    if (!listRef.current) return
    const activeItem = listRef.current.querySelector('[aria-selected="true"]')
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, filteredActions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredActions[selectedIndex]) {
          filteredActions[selectedIndex].onSelect()
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }, [filteredActions, selectedIndex, onClose])

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }, [onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] modal-backdrop-enter"
      onClick={handleOverlayClick}
      data-testid="command-palette"
    >
      <div
        className="w-full max-w-lg mx-4 bg-neutral-900 border border-neutral-700/60 rounded-xl shadow-2xl command-palette-enter overflow-hidden"
        role="combobox"
        aria-expanded="true"
        aria-haspopup="listbox"
        aria-owns="command-palette-listbox"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800/60">
          <svg className="w-5 h-5 text-neutral-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            className="flex-1 bg-transparent text-sm text-neutral-200 placeholder-neutral-500 outline-none"
            aria-label="Command palette search"
            aria-autocomplete="list"
            aria-controls="command-palette-listbox"
            aria-activedescendant={filteredActions[selectedIndex] ? `cmd-${filteredActions[selectedIndex].id}` : undefined}
            data-testid="command-palette-input"
          />
          <kbd className="hidden sm:inline-flex items-center text-[10px] text-neutral-600 border border-neutral-800 rounded px-1.5 py-0.5 font-mono">
            ESC
          </kbd>
        </div>

        <ul
          id="command-palette-listbox"
          ref={listRef}
          role="listbox"
          aria-label="Command results"
          className="max-h-72 overflow-y-auto py-2"
          data-testid="command-palette-list"
        >
          {filteredActions.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-neutral-500">
              No matching commands
            </li>
          ) : (
            filteredActions.map((action, index) => {
              const isSelected = index === selectedIndex
              const teamMatch = action.id.startsWith('team-')
                ? teams.find(t => `team-${t.id}` === action.id)
                : null

              return (
                <li
                  key={action.id}
                  id={`cmd-${action.id}`}
                  role="option"
                  aria-selected={isSelected}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors duration-75 ${
                    isSelected
                      ? 'bg-accent-500/15 text-neutral-100'
                      : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
                  }`}
                  onClick={() => action.onSelect()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  data-testid="command-palette-item"
                >
                  <span className={`flex-shrink-0 ${isSelected ? 'text-accent-400' : 'text-neutral-600'}`}>
                    {action.icon === 'team' && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                    {action.icon === 'grid' && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    )}
                    {action.icon === 'create' && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                    {action.icon === 'filter' && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{action.label}</span>
                      {teamMatch && (
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT_COLORS[teamMatch.status]}`} />
                      )}
                    </div>
                    <span className={`text-xs ${isSelected ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      {action.description}
                    </span>
                  </div>
                  {isSelected && (
                    <kbd className="hidden sm:inline-flex text-[10px] text-neutral-600 border border-neutral-800 rounded px-1.5 py-0.5 font-mono flex-shrink-0">
                      Enter
                    </kbd>
                  )}
                </li>
              )
            })
          )}
        </ul>

        <div className="flex items-center gap-4 px-4 py-2 border-t border-neutral-800/60 text-[10px] text-neutral-600">
          <span className="flex items-center gap-1">
            <kbd className="border border-neutral-800 rounded px-1 py-0.5 font-mono">&#x2191;</kbd>
            <kbd className="border border-neutral-800 rounded px-1 py-0.5 font-mono">&#x2193;</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="border border-neutral-800 rounded px-1 py-0.5 font-mono">Enter</kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="border border-neutral-800 rounded px-1 py-0.5 font-mono">Esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default CommandPalette
