import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './auth/AuthContext'
import { TEAMS } from './config'
import { TeamPanel } from './components/TeamPanel'
import { LoginPage } from './components/LoginPage'
import { seedDatabase, checkDataExists } from './data/seed'

export default function App() {
  const { user, loading, signOut } = useAuth()
  const [seeding, setSeeding] = useState(false)
  const [hasData, setHasData] = useState<boolean | null>(null)

  const checkData = useCallback(async () => {
    try {
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
      await seedDatabase()
      setHasData(true)
    } catch (err) {
      console.error('[seed] Failed to seed database:', err)
    } finally {
      setSeeding(false)
    }
  }

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
    return <LoginPage />
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-10 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800/50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot" aria-hidden="true" />
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
      </header>

      <main className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {TEAMS.map((team, index) => (
            <div key={team.id} className="animate-fade-in" style={{ animationDelay: `${index * 80}ms` }}>
              <TeamPanel teamId={team.id} teamName={team.name} />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
