import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import { useAuth } from './auth/AuthContext'
import { TEAMS } from './config'
import { TeamPanel } from './components/TeamPanel'
import { SearchBar, type StatusFilter } from './components/SearchBar'
import { useConnectionStatus } from './hooks/useConnectionStatus'
import { useData } from './services/data'
import { TeamDataSchema } from './schemas'

const LoginPage = lazy(() => import('./components/LoginPage').then(m => ({ default: m.LoginPage })))
const TeamDetailModal = lazy(() => import('./components/TeamDetailModal').then(m => ({ default: m.TeamDetailModal })))

function useAllTeamData() {
  // Subscribe to all teams' data for filtering
  // TEAMS is a static constant, so hook count is stable
  const t01 = useData('teams/t01', TeamDataSchema)
  const t02 = useData('teams/t02', TeamDataSchema)
  const t03 = useData('teams/t03', TeamDataSchema)

  return useMemo(() => ({
    t01: t01.data,
    t02: t02.data,
    t03: t03.data,
  }), [t01.data, t02.data, t03.data])
}

function getTeamStatus(teamData: { agents?: Record<string, { status: string }> } | null): 'active' | 'error' | 'idle' {
  if (!teamData?.agents) return 'idle'
  const statuses = Object.values(teamData.agents).map(a => a.status)
  if (statuses.includes('error')) return 'error'
  if (statuses.includes('active')) return 'active'
  return 'idle'
}

export default function App() {
  const { user, loading, signOut } = useAuth()
  const connected = useConnectionStatus()
  const [seeding, setSeeding] = useState(false)
  const [hasData, setHasData] = useState<boolean | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedTeam, setSelectedTeam] = useState<{ id: string; name: string } | null>(null)

  const allTeamData = useAllTeamData()

  const checkData = useCallback(async () => {
    try {
      const { checkDataExists } = await import('./data/seed')
      const exists = await checkDataExists()
      setHasData(exists)
    } catch {
      setHasData(null)
    }
  }, [])

  useEffect(() => {
    if (user) {
      void checkData()
    }
  }, [user, checkData])

  const handleSeed = async () => {
    setSeeding(true)
    try {
      const { seedDatabase } = await import('./data/seed')
      await seedDatabase()
      setHasData(true)
    } catch (err) {
      console.error('[seed] Failed to seed database:', err)
    } finally {
      setSeeding(false)
    }
  }

  // Compute team statuses and filter
  const teamsWithStatus = useMemo(() => {
    return TEAMS.map((team) => {
      const data = allTeamData[team.id as keyof typeof allTeamData] ?? null
      const status = getTeamStatus(data)
      const displayName = data?.name ?? team.name
      return { ...team, status, displayName, data }
    })
  }, [allTeamData])

  const statusCounts = useMemo(() => {
    const counts = { all: TEAMS.length, active: 0, error: 0, idle: 0 }
    for (const t of teamsWithStatus) {
      counts[t.status]++
    }
    return counts
  }, [teamsWithStatus])

  const filteredTeams = useMemo(() => {
    return teamsWithStatus.filter((team) => {
      // Search filter: match against display name (case-insensitive)
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const nameMatch = team.displayName.toLowerCase().includes(query)
        if (!nameMatch) return false
      }
      // Status filter
      if (statusFilter !== 'all' && team.status !== statusFilter) {
        return false
      }
      return true
    })
  }, [teamsWithStatus, searchQuery, statusFilter])

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
              {TEAMS.length} teams
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => void handleSeed()}
              disabled={seeding}
              className="focus-ring text-xs font-medium px-3 py-1.5 rounded-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed bg-accent-500/10 text-accent-400 border border-accent-500/20 hover:bg-accent-500/20 hover:border-accent-500/30"
              aria-label={hasData ? 'Reset demo data' : 'Seed demo data'}
            >
              {seeding ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse-dot" aria-hidden="true" />
                  Seeding...
                </span>
              ) : hasData ? (
                'Reset Demo Data'
              ) : (
                'Seed Demo Data'
              )}
            </button>
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

        {/* Search and filter bar */}
        <div className="px-6 pb-4">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            statusCounts={statusCounts}
          />
        </div>
      </header>

      <main className="p-6">
        {filteredTeams.length === 0 ? (
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
        )}
      </main>

      {/* Team Detail Modal */}
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
    </div>
  )
}
