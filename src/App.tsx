import { lazy, Suspense } from 'react'
import { useAuth } from './auth/AuthContext'
import { TeamPanel } from './components/TeamPanel'
import { useConnectionStatus } from './hooks/useConnectionStatus'
import { useUserTeam } from './hooks/useUserTeam'

const LoginPage = lazy(() => import('./components/LoginPage').then(m => ({ default: m.LoginPage })))

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
  const { teamId, loading: teamLoading } = useUserTeam(user.uid)

  if (teamLoading) {
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
      </header>

      <main className="p-6" id="team-content" role="main">
        <div className="max-w-5xl mx-auto animate-fade-in">
          <TeamPanel teamId={teamId} teamName="My Team" />
        </div>
      </main>
    </div>
  )
}
