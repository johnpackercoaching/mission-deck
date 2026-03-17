import { useAuth } from './auth/AuthContext'
import { TEAMS } from './config'
import { TeamPanel } from './components/TeamPanel'
import { LoginPage } from './components/LoginPage'

export default function App() {
  const { user, loading, signOut } = useAuth()

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
          <div className="flex items-center gap-4">
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
