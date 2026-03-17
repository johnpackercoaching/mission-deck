import { useState, useMemo, useEffect, useCallback, useRef, lazy, Suspense } from 'react'
import { useAuth } from './auth/AuthContext'
import { MAX_TEAMS } from './config'
import { TeamPanel } from './components/TeamPanel'
import { SearchBar, type StatusFilter } from './components/SearchBar'
import { TeamSelector } from './components/TeamSelector'
import { CreateTeamDialog } from './components/CreateTeamDialog'
import { DeleteTeamDialog } from './components/DeleteTeamDialog'
import { useConnectionStatus } from './hooks/useConnectionStatus'
import { useTeamList } from './hooks/useTeamList'
import { useData, writeData, removeData } from './services/data'
import { TeamDataSchema } from './schemas'

const LoginPage = lazy(() => import('./components/LoginPage').then(m => ({ default: m.LoginPage })))
const TeamDetailModal = lazy(() => import('./components/TeamDetailModal').then(m => ({ default: m.TeamDetailModal })))

const STORAGE_KEY = 'mission-deck-focused-team'

type TeamStatus = 'active' | 'error' | 'idle'

function getTeamStatus(teamData: { agents?: Record<string, { status: string }> } | null): TeamStatus {
  if (!teamData?.agents) return 'idle'
  const statuses = Object.values(teamData.agents).map(a => a.status)
  if (statuses.includes('error')) return 'error'
  if (statuses.includes('active')) return 'active'
  return 'idle'
}

/**
 * Component that subscribes to a single team's data and reports its status
 * via a callback. This solves the "hooks can't be called in a loop" problem:
 * we render one tracker per team in the team list.
 */
function TeamStatusTracker({
  teamId,
  onStatus,
}: {
  teamId: string
  onStatus: (teamId: string, status: TeamStatus, data: { name?: string } | null) => void
}) {
  const { data } = useData(`teams/${teamId}`, TeamDataSchema)
  const onStatusRef = useRef(onStatus)
  onStatusRef.current = onStatus

  useEffect(() => {
    const status = getTeamStatus(data)
    onStatusRef.current(teamId, status, data ? { name: data.name } : null)
  }, [teamId, data])

  return null
}

function getInitialFocusedTeam(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === null) return null
    return stored
  } catch {
    return null
  }
}

export default function App() {
  const { user, loading, signOut } = useAuth()
  const connected = useConnectionStatus()
  const { teams: teamList, loading: teamsLoading } = useTeamList()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedTeam, setSelectedTeam] = useState<{ id: string; name: string } | null>(null)
  const [focusedTeamId, setFocusedTeamId] = useState<string | null>(getInitialFocusedTeam)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  // Track statuses for all teams dynamically
  const [teamStatuses, setTeamStatuses] = useState<Record<string, { status: TeamStatus; displayName: string }>>({})

  const handleTeamStatus = useCallback(
    (teamId: string, status: TeamStatus, data: { name?: string } | null) => {
      setTeamStatuses(prev => {
        const existing = prev[teamId]
        const displayName = data?.name ?? teamId
        if (existing && existing.status === status && existing.displayName === displayName) {
          return prev
        }
        return { ...prev, [teamId]: { status, displayName } }
      })
    },
    []
  )

  // Validate focused team against actual team list
  useEffect(() => {
    if (focusedTeamId !== null && !teamsLoading && teamList.length > 0) {
      const exists = teamList.some(t => t.id === focusedTeamId)
      if (!exists) {
        setFocusedTeamId(null)
      }
    }
  }, [focusedTeamId, teamList, teamsLoading])

  // Persist focused team to localStorage
  useEffect(() => {
    try {
      if (focusedTeamId === null) {
        localStorage.removeItem(STORAGE_KEY)
      } else {
        localStorage.setItem(STORAGE_KEY, focusedTeamId)
      }
    } catch {
      // localStorage unavailable
    }
  }, [focusedTeamId])

  const handleSelectTeam = useCallback((teamId: string | null) => {
    setFocusedTeamId(teamId)
    if (teamId !== null) {
      setSearchQuery('')
      setStatusFilter('all')
    }
  }, [])

  const handleCreateTeam = useCallback(async (name: string) => {
    const id = crypto.randomUUID().slice(0, 8)
    await writeData(`teams/${id}`, {
      name,
      project: { previewUrl: '', prompts: {} },
      terminal: { lines: {} },
      artifacts: {},
      agents: {},
    })
    setShowCreateDialog(false)
    setFocusedTeamId(id)
  }, [])

  const handleDeleteTeam = useCallback(async () => {
    if (!deleteTarget) return
    const deletedId = deleteTarget.id
    await removeData(`teams/${deletedId}`)
    setDeleteTarget(null)
    if (focusedTeamId === deletedId) {
      setFocusedTeamId(null)
    }
  }, [deleteTarget, focusedTeamId])

  const handleRequestDelete = useCallback((teamId: string, teamName: string) => {
    setDeleteTarget({ id: teamId, name: teamName })
  }, [])

  const teamsWithStatus = useMemo(() => {
    return teamList.map((team) => {
      const tracked = teamStatuses[team.id]
      const status: TeamStatus = tracked?.status ?? 'idle'
      const displayName = tracked?.displayName ?? team.name
      return { ...team, status, displayName }
    })
  }, [teamList, teamStatuses])

  const statusCounts = useMemo(() => {
    const counts = { all: teamsWithStatus.length, active: 0, error: 0, idle: 0 }
    for (const t of teamsWithStatus) {
      counts[t.status]++
    }
    return counts
  }, [teamsWithStatus])

  const filteredTeams = useMemo(() => {
    return teamsWithStatus.filter((team) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const nameMatch = team.displayName.toLowerCase().includes(query)
        if (!nameMatch) return false
      }
      if (statusFilter !== 'all' && team.status !== statusFilter) {
        return false
      }
      return true
    })
  }, [teamsWithStatus, searchQuery, statusFilter])

  const focusedTeam = focusedTeamId
    ? teamsWithStatus.find(t => t.id === focusedTeamId) ?? null
    : null

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

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Render one TeamStatusTracker per team to subscribe to their data */}
      {teamList.map(team => (
        <TeamStatusTracker key={team.id} teamId={team.id} onStatus={handleTeamStatus} />
      ))}

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
            <span className="text-xs text-neutral-600 font-mono hidden sm:inline" aria-label="Team count">
              {focusedTeam ? `Viewing ${focusedTeam.displayName}` : `${teamList.length} teams`}
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

        {/* Team selector tabs */}
        <div className="px-6 pb-3">
          <TeamSelector
            teams={teamsWithStatus.map(t => ({ id: t.id, name: t.displayName, status: t.status }))}
            focusedTeamId={focusedTeamId}
            onSelectTeam={handleSelectTeam}
            onCreateTeam={() => setShowCreateDialog(true)}
            onDeleteTeam={handleRequestDelete}
            canCreate={teamList.length < MAX_TEAMS}
          />
        </div>

        {/* Search and filter bar -- only in grid (All Teams) view */}
        {focusedTeamId === null && teamList.length > 0 && (
          <div className="px-6 pb-4">
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              statusCounts={statusCounts}
            />
          </div>
        )}
      </header>

      <main className="p-6" id="team-content" role="tabpanel">
        {focusedTeamId === null ? (
          teamList.length === 0 && !teamsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center" data-testid="empty-state">
              <svg
                className="w-16 h-16 text-neutral-700 mb-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              <h2 className="text-lg font-semibold text-neutral-300 mb-2">No teams yet</h2>
              <p className="text-sm text-neutral-500 mb-6 max-w-sm">
                Create your first team to start monitoring agent activity in real time.
              </p>
              <button
                onClick={() => setShowCreateDialog(true)}
                className="focus-ring text-sm font-medium text-white bg-accent-600 hover:bg-accent-500 px-5 py-2.5 rounded-lg transition-all duration-150"
                data-testid="empty-state-create"
              >
                Create Your First Team
              </button>
            </div>
          ) : filteredTeams.length === 0 && teamList.length > 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <svg
                className="w-12 h-12 text-neutral-700 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-neutral-400 text-sm mb-1">No teams match your search</p>
              <p className="text-neutral-600 text-xs">
                Try adjusting your search query or status filter
              </p>
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter('all') }}
                className="focus-ring mt-4 text-xs text-accent-400 hover:text-accent-300 transition-colors duration-150"
                data-testid="clear-filters"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredTeams.map((team, index) => (
                <div key={team.id} className="animate-fade-in" style={{ animationDelay: `${index * 80}ms` }}>
                  <TeamPanel
                    teamId={team.id}
                    teamName={team.name}
                    onClick={() => setSelectedTeam({ id: team.id, name: team.displayName })}
                  />
                </div>
              ))}
            </div>
          )
        ) : (
          focusedTeam && (
            <div className="max-w-5xl mx-auto animate-fade-in">
              <TeamPanel
                teamId={focusedTeam.id}
                teamName={focusedTeam.name}
              />
            </div>
          )
        )}
      </main>

      {selectedTeam && (
        <Suspense fallback={null}>
          <TeamDetailModal
            teamId={selectedTeam.id}
            teamName={selectedTeam.name}
            isOpen={true}
            onClose={() => setSelectedTeam(null)}
          />
        </Suspense>
      )}

      <CreateTeamDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreateTeam}
        currentTeamCount={teamList.length}
        maxTeams={MAX_TEAMS}
      />

      {deleteTarget && (
        <DeleteTeamDialog
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteTeam}
          teamName={deleteTarget.name}
        />
      )}
    </div>
  )
}
