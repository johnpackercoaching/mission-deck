import { lazy, Suspense, useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useAuth } from './auth/AuthContext'
import { TeamPanel } from './components/TeamPanel'
import { TeamSelector } from './components/TeamSelector'
import { SearchBar } from './components/SearchBar'
import type { StatusFilter } from './components/SearchBar'
import { DashboardStats } from './components/DashboardStats'
import { CreateTeamDialog } from './components/CreateTeamDialog'
import { DeleteTeamDialog } from './components/DeleteTeamDialog'
import { SettingsPanel } from './components/SettingsPanel'
import { KeyboardShortcutsPanel } from './components/KeyboardShortcutsPanel'
import { ToastContainer } from './components/ToastContainer'
import type { Toast } from './components/ToastContainer'
import { useConnectionStatus } from './hooks/useConnectionStatus'
import { useUserTeam } from './hooks/useUserTeam'
import { useTeamList } from './hooks/useTeamList'
import { useTheme } from './hooks/useTheme'
import { LiveActivityFeed } from './components/LiveActivityFeed'
import type { ActivityEvent } from './components/LiveActivityFeed'
import { useData, writeData, removeData } from './services/data'
import { MAX_TEAMS, AGENTS } from './config'
import { TeamDataSchema, TimelineEventSchema } from './schemas'
import { z } from 'zod'

const LoginPage = lazy(() => import('./components/LoginPage').then(m => ({ default: m.LoginPage })))
const TeamDetailModal = lazy(() => import('./components/TeamDetailModal').then(m => ({ default: m.TeamDetailModal })))
const CommandPalette = lazy(() => import('./components/CommandPalette').then(m => ({ default: m.CommandPalette })))

const STORAGE_KEY = 'mission-deck-focused-team'

function getInitialFocusedTeam(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

interface AgentCounts {
  active: number
  error: number
  complete: number
}

/** Invisible component that subscribes to a single team's data and reports its status */
function TeamStatusTracker({
  teamId,
  onStatus,
  onAgentError,
  onAgentCounts,
}: {
  teamId: string
  onStatus: (id: string, status: 'active' | 'error' | 'idle') => void
  onAgentError?: (teamId: string, teamName: string, agentId: string, agentName: string) => void
  onAgentCounts?: (id: string, counts: AgentCounts) => void
}) {
  const { data } = useData(`teams/${teamId}`, TeamDataSchema)
  const onStatusRef = useRef(onStatus)
  onStatusRef.current = onStatus
  const onAgentErrorRef = useRef(onAgentError)
  onAgentErrorRef.current = onAgentError
  const onAgentCountsRef = useRef(onAgentCounts)
  onAgentCountsRef.current = onAgentCounts
  const prevAgentStatusesRef = useRef<Record<string, string>>({})

  useEffect(() => {
    if (!data) {
      onStatusRef.current(teamId, 'idle')
      onAgentCountsRef.current?.(teamId, { active: 0, error: 0, complete: 0 })
      return
    }
    const agents = data.agents ?? {}
    const agentValues = Object.values(agents)
    const hasError = agentValues.some(a => a.status === 'error')
    const hasActive = agentValues.some(a => a.status === 'active')
    onStatusRef.current(teamId, hasError ? 'error' : hasActive ? 'active' : 'idle')

    // Report agent counts
    onAgentCountsRef.current?.(teamId, {
      active: agentValues.filter(a => a.status === 'active').length,
      error: agentValues.filter(a => a.status === 'error').length,
      complete: agentValues.filter(a => a.status === 'complete').length,
    })

    // Detect agent error transitions
    if (onAgentErrorRef.current) {
      const prevStatuses = prevAgentStatusesRef.current
      for (const [agentId, agentData] of Object.entries(agents)) {
        if (agentData.status === 'error' && prevStatuses[agentId] !== 'error') {
          onAgentErrorRef.current(teamId, data.name, agentId, agentData.name)
        }
      }
    }

    // Update previous statuses
    const newStatuses: Record<string, string> = {}
    for (const [agentId, agentData] of Object.entries(agents)) {
      newStatuses[agentId] = agentData.status
    }
    prevAgentStatusesRef.current = newStatuses
  }, [data, teamId])

  return null
}

/** Invisible component that subscribes to a team's timeline and reports events */
function TimelineDataCollector({
  teamId,
  teamName,
  onEvents,
}: {
  teamId: string
  teamName: string
  onEvents: (teamId: string, teamName: string, events: Record<string, { agentName: string; status: string; fromStatus?: string | null; timestamp: number; message?: string }> | null) => void
}) {
  const { data: timeline } = useData(
    `teams/${teamId}/timeline`,
    z.record(z.string(), TimelineEventSchema),
  )
  const onEventsRef = useRef(onEvents)
  onEventsRef.current = onEvents
  const prevJsonRef = useRef<string>('')

  useEffect(() => {
    const json = JSON.stringify(timeline) ?? ''
    if (json === prevJsonRef.current) return
    prevJsonRef.current = json
    onEventsRef.current(teamId, teamName, timeline)
  }, [timeline, teamId, teamName])

  return null
}

export default function App() {
  const { user, loading, signOut } = useAuth()
  const connected = useConnectionStatus()

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-accent-500 animate-pulse-dot" />
          <p className="text-neutral-400 text-sm">Loading Mission Deck...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-accent-500 animate-pulse-dot" />
            <p className="text-neutral-400 text-sm">Loading...</p>
          </div>
        </div>
      }>
        <LoginPage />
      </Suspense>
    )
  }

  return <AuthenticatedApp user={user} connected={connected} signOut={signOut} />
}

function AuthenticatedApp({
  user,
  connected,
  signOut,
}: {
  user: { uid: string; email: string | null; displayName: string | null }
  connected: boolean
  signOut: () => Promise<void>
}) {
  // Auto-create user's default team
  const { loading: teamLoading } = useUserTeam(user.uid)

  // Read all teams
  const { teams, loading: teamsLoading } = useTeamList()

  // Theme
  const { theme, setTheme } = useTheme()

  // UI state
  const [focusedTeamId, setFocusedTeamId] = useState<string | null>(getInitialFocusedTeam)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [teamStatuses, setTeamStatuses] = useState<Record<string, 'active' | 'error' | 'idle'>>({})
  const [teamAgentCounts, setTeamAgentCounts] = useState<Record<string, AgentCounts>>({})
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [modalTarget, setModalTarget] = useState<{ id: string; name: string } | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  // Cross-team timeline events for live activity feed
  const [teamTimelineData, setTeamTimelineData] = useState<Record<string, { teamName: string; events: Record<string, { agentName: string; status: string; fromStatus?: string | null; timestamp: number; message?: string }> }>>({})

  const handleTimelineEvents = useCallback((
    teamId: string,
    teamName: string,
    events: Record<string, { agentName: string; status: string; fromStatus?: string | null; timestamp: number; message?: string }> | null
  ) => {
    setTeamTimelineData(prev => {
      if (!events) {
        if (!prev[teamId]) return prev
        const next = { ...prev }
        delete next[teamId]
        return next
      }
      return { ...prev, [teamId]: { teamName, events } }
    })
  }, [])

  const activityEvents = useMemo<ActivityEvent[]>(() => {
    const all: ActivityEvent[] = []
    for (const [teamId, { teamName, events }] of Object.entries(teamTimelineData)) {
      for (const [key, evt] of Object.entries(events)) {
        all.push({
          key: `${teamId}-${key}`,
          teamId,
          teamName,
          agentName: evt.agentName,
          status: evt.status,
          fromStatus: evt.fromStatus ?? null,
          timestamp: evt.timestamp,
          message: evt.message,
        })
      }
    }
    return all.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50)
  }, [teamTimelineData])

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Global ? shortcut for keyboard shortcuts panel
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement
        const tag = target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return
        e.preventDefault()
        setShortcutsOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Persist focused team to localStorage
  useEffect(() => {
    try {
      if (focusedTeamId) {
        localStorage.setItem(STORAGE_KEY, focusedTeamId)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [focusedTeamId])

  // Clear focusedTeamId if team no longer exists
  useEffect(() => {
    if (focusedTeamId && !teamsLoading && teams.length > 0) {
      const exists = teams.some(t => t.id === focusedTeamId)
      if (!exists) {
        setFocusedTeamId(null)
      }
    }
  }, [focusedTeamId, teams, teamsLoading])

  // Status update callback
  const handleStatusUpdate = useCallback((id: string, status: 'active' | 'error' | 'idle') => {
    setTeamStatuses(prev => {
      if (prev[id] === status) return prev
      return { ...prev, [id]: status }
    })
  }, [])

  // Agent counts callback
  const handleAgentCounts = useCallback((id: string, counts: AgentCounts) => {
    setTeamAgentCounts(prev => {
      const existing = prev[id]
      if (existing && existing.active === counts.active && existing.error === counts.error && existing.complete === counts.complete) {
        return prev
      }
      return { ...prev, [id]: counts }
    })
  }, [])

  // Aggregate stats for DashboardStats
  const aggregateStats = useMemo(() => {
    const allCounts = Object.values(teamAgentCounts)
    const totalActiveAgents = allCounts.reduce((sum, c) => sum + c.active, 0)
    const totalErrors = allCounts.reduce((sum, c) => sum + c.error, 0)
    const totalCompleted = allCounts.reduce((sum, c) => sum + c.complete, 0)
    const totalPhases = teams.length * AGENTS.length
    return {
      teamCount: teams.length,
      activeAgents: totalActiveAgents,
      errorCount: totalErrors,
      completedPhases: totalCompleted,
      totalPhases,
    }
  }, [teamAgentCounts, teams.length])

  // Team CRUD
  const handleCreateTeam = useCallback(async (name: string) => {
    const id = crypto.randomUUID().slice(0, 8)
    await writeData(`teams/${id}`, {
      name,
      project: { previewUrl: '', prompts: {} },
      terminal: { lines: {} },
      artifacts: {},
      agents: {},
      timeline: {},
    })
    setCreateDialogOpen(false)
  }, [])

  const handleDeleteTeam = useCallback(async () => {
    if (!deleteTarget) return
    await removeData(`teams/${deleteTarget.id}`)
    if (focusedTeamId === deleteTarget.id) {
      setFocusedTeamId(null)
    }
    setDeleteTarget(null)
  }, [deleteTarget, focusedTeamId])

  const handleSelectTeam = useCallback((teamId: string | null) => {
    setFocusedTeamId(teamId)
  }, [])

  const handleSetStatusFilter = useCallback((filter: StatusFilter) => {
    setStatusFilter(filter)
    setFocusedTeamId(null)
  }, [])

  const handleOpenModal = useCallback((teamId: string, teamName: string) => {
    setModalTarget({ id: teamId, name: teamName })
  }, [])

  const handleAgentError = useCallback((teamId: string, teamName: string, agentId: string, agentName: string) => {
    const id = `${teamId}-${agentId}-${Date.now()}`
    setToasts(prev => [...prev, { id, teamName, agentName, timestamp: Date.now() }])
  }, [])

  const handleDismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Filtering
  const filteredTeams = useMemo(() => {
    let result = teams

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(t => t.name.toLowerCase().includes(q))
    }

    if (statusFilter !== 'all') {
      result = result.filter(t => (teamStatuses[t.id] ?? 'idle') === statusFilter)
    }

    return result
  }, [teams, searchQuery, statusFilter, teamStatuses])

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = { all: teams.length, active: 0, error: 0, idle: 0 }
    for (const team of teams) {
      const status = teamStatuses[team.id] ?? 'idle'
      counts[status]++
    }
    return counts
  }, [teams, teamStatuses])

  // Team tabs with status for TeamSelector
  const teamTabs = useMemo(() => {
    return teams.map(t => ({
      id: t.id,
      name: t.name,
      status: (teamStatuses[t.id] ?? 'idle') as 'active' | 'error' | 'idle',
    }))
  }, [teams, teamStatuses])

  // Focused team info
  const focusedTeam = focusedTeamId ? teams.find(t => t.id === focusedTeamId) : null

  const isLoading = teamLoading || teamsLoading

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-accent-500 animate-pulse-dot" />
          <p className="text-neutral-400 text-sm">Setting up your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-app">
      <header className="sticky top-0 z-10 bg-header backdrop-blur-md border-b border-themed">
        <div className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse-dot' : 'bg-yellow-500'}`}
                title={connected ? 'Connected to Firebase' : 'Disconnected from Firebase'}
                aria-label={connected ? 'Connected to Firebase' : 'Disconnected from Firebase'}
              />
              <h1 className="text-xl font-semibold text-heading tracking-tight">
                Mission Deck
              </h1>
            </div>
            <span className="text-sm text-secondary">
              {focusedTeam
                ? `Viewing ${focusedTeam.name}`
                : `${teams.length} team${teams.length !== 1 ? 's' : ''}`}
            </span>
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="focus-ring text-xs text-secondary hover:text-heading px-2 py-1 rounded-md border border-themed hover:bg-hover transition-all duration-150 hidden sm:inline-flex items-center gap-1"
              aria-label="Open command palette"
              data-testid="command-palette-trigger"
            >
              <kbd className="font-sans">&#x2318;K</kbd>
            </button>
            <button
              onClick={() => setShortcutsOpen(true)}
              className="focus-ring text-xs text-secondary hover:text-heading px-2 py-1 rounded-md border border-themed hover:bg-hover transition-all duration-150 hidden sm:inline-flex items-center gap-1"
              aria-label="Open keyboard shortcuts"
              data-testid="shortcuts-trigger"
            >
              <kbd className="font-sans">?</kbd>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-secondary hidden sm:inline truncate max-w-48">
              {user.email}
            </span>
            <button
              onClick={() => setSettingsOpen(true)}
              className="focus-ring text-secondary hover:text-heading p-1.5 rounded-md hover:bg-surface-800/50 transition-all duration-150"
              aria-label="Open settings"
              data-testid="settings-trigger"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={() => void signOut()}
              className="focus-ring text-xs text-secondary hover:text-heading px-3 py-1.5 rounded-md hover:bg-surface-800/50 transition-all duration-150"
              aria-label="Sign out"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Team Selector */}
        <div className="px-6 pb-3">
          <TeamSelector
            teams={teamTabs}
            focusedTeamId={focusedTeamId}
            onSelectTeam={handleSelectTeam}
            onCreateTeam={() => setCreateDialogOpen(true)}
            onDeleteTeam={(id, name) => setDeleteTarget({ id, name })}
            canCreate={teams.length < MAX_TEAMS}
          />
        </div>
      </header>

      <main className="p-3 sm:p-6" id="team-content" role="main">
        {/* Dashboard Stats - grid view only */}
        {!focusedTeamId && teams.length > 0 && (
          <div className="mb-6 animate-fade-in">
            <DashboardStats
              teamCount={aggregateStats.teamCount}
              activeAgents={aggregateStats.activeAgents}
              errorCount={aggregateStats.errorCount}
              completedPhases={aggregateStats.completedPhases}
              totalPhases={aggregateStats.totalPhases}
            />
          </div>
        )}

        {/* Live Activity Feed - grid view only */}
        {!focusedTeamId && teams.length > 0 && (
          <div className="mb-6 animate-fade-in">
            <LiveActivityFeed events={activityEvents} />
          </div>
        )}

        {/* Search bar - hidden in focused view */}
        {!focusedTeamId && teams.length > 0 && (
          <div className="mb-6 animate-fade-in">
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              statusCounts={statusCounts}
            />
          </div>
        )}

        {/* Empty state */}
        {teams.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <p className="text-neutral-400 text-lg mb-4">No teams yet</p>
            <button
              onClick={() => setCreateDialogOpen(true)}
              className="focus-ring text-sm font-medium text-accent-400 hover:text-accent-300 px-4 py-2 rounded-lg border border-accent-500/30 hover:bg-accent-500/10 transition-all duration-150"
            >
              Create your first team
            </button>
          </div>
        )}

        {/* Focused single-team view */}
        {focusedTeamId && focusedTeam && (
          <div className="max-w-5xl mx-auto animate-fade-in">
            <TeamPanel
              teamId={focusedTeamId}
              teamName={focusedTeam.name}
              onClick={() => handleOpenModal(focusedTeamId, focusedTeam.name)}
            />
          </div>
        )}

        {/* Grid view */}
        {!focusedTeamId && filteredTeams.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            {filteredTeams.map(team => (
              <TeamPanel
                key={team.id}
                teamId={team.id}
                teamName={team.name}
                onClick={() => handleOpenModal(team.id, team.name)}
              />
            ))}
          </div>
        )}

        {/* No results from filtering */}
        {!focusedTeamId && teams.length > 0 && filteredTeams.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <p className="text-neutral-400 text-lg mb-2">No teams match your filters</p>
            <button
              onClick={() => { setSearchQuery(''); setStatusFilter('all') }}
              className="focus-ring text-sm text-accent-400 hover:text-accent-300 transition-colors duration-150"
            >
              Clear all filters
            </button>
          </div>
        )}
      </main>

      {/* Invisible status trackers - one per team */}
      {teams.map(team => (
        <TeamStatusTracker key={team.id} teamId={team.id} onStatus={handleStatusUpdate} onAgentError={handleAgentError} onAgentCounts={handleAgentCounts} />
      ))}

      {/* Invisible timeline collectors - one per team */}
      {teams.map(team => (
        <TimelineDataCollector key={`tl-${team.id}`} teamId={team.id} teamName={team.name} onEvents={handleTimelineEvents} />
      ))}

      {/* Create Team Dialog */}
      <CreateTeamDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateTeam}
        currentTeamCount={teams.length}
        maxTeams={MAX_TEAMS}
      />

      {/* Delete Team Dialog */}
      <DeleteTeamDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDeleteTeam()}
        teamName={deleteTarget?.name ?? ''}
      />

      {/* Team Detail Modal */}
      {modalTarget && (
        <Suspense fallback={null}>
          <TeamDetailModal
            teamId={modalTarget.id}
            teamName={modalTarget.name}
            isOpen={true}
            onClose={() => setModalTarget(null)}
          />
        </Suspense>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      {/* Command Palette */}
      <Suspense fallback={null}>
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          teams={teamTabs}
          focusedTeamId={focusedTeamId}
          onSelectTeam={handleSelectTeam}
          onCreateTeam={() => { setCreateDialogOpen(true); setCommandPaletteOpen(false) }}
          onSetStatusFilter={handleSetStatusFilter}
        />
      </Suspense>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
      />

      {/* Keyboard Shortcuts Panel */}
      <KeyboardShortcutsPanel
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </div>
  )
}
