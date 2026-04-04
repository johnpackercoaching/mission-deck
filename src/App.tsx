import { lazy, Suspense, useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useAuth } from './auth/AuthContext'
import { TeamPanel } from './components/TeamPanel'
import { TeamSelector } from './components/TeamSelector'
import { SearchBar } from './components/SearchBar'
import type { StatusFilter } from './components/SearchBar'
import { DashboardStats } from './components/DashboardStats'
import { CreateTeamDialog } from './components/CreateTeamDialog'
import { DeleteTeamDialog } from './components/DeleteTeamDialog'
import { ToastContainer } from './components/ToastContainer'
import type { Toast } from './components/ToastContainer'
import { useConnectionStatus } from './hooks/useConnectionStatus'
import { useUserTeam } from './hooks/useUserTeam'
import { useTeamList } from './hooks/useTeamList'
import { useData, writeData, removeData } from './services/data'
import { MAX_TEAMS, AGENTS } from './config'
import { TeamDataSchema } from './schemas'

const LoginPage = lazy(() => import('./components/LoginPage').then(m => ({ default: m.LoginPage })))
const TeamDetailModal = lazy(() => import('./components/TeamDetailModal').then(m => ({ default: m.TeamDetailModal })))

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
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-10 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800/50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse-dot' : 'bg-yellow-500'}`}
                title={connected ? 'Connected to Firebase' : 'Disconnected from Firebase'}
                aria-label={connected ? 'Connected to Firebase' : 'Disconnected from Firebase'}
              />
              <h1 className="text-xl font-semibold text-neutral-100 tracking-tight">
                Mission Deck
              </h1>
            </div>
            <span className="text-sm text-neutral-500">
              {focusedTeam
                ? `Viewing ${focusedTeam.name}`
                : `${teams.length} team${teams.length !== 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-500 hidden sm:inline truncate max-w-48">
              {user.email}
            </span>
            <button
              onClick={() => void signOut()}
              className="focus-ring text-xs text-neutral-500 hover:text-neutral-300 px-3 py-1.5 rounded-md hover:bg-neutral-800/50 transition-all duration-150"
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

      <main className="p-6" id="team-content" role="main">
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
    </div>
  )
}
