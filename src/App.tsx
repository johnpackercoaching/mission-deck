import { useAuth } from './auth/AuthContext'
import { TEAMS } from './config'
import { TeamPanel } from './components/TeamPanel'
import { LoginPage } from './components/LoginPage'

export default function App() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <p className="text-neutral-500">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-100">Mission Deck</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-400">{user.email}</span>
            <button
              onClick={() => void signOut()}
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {TEAMS.map((team) => (
          <TeamPanel key={team.id} teamId={team.id} teamName={team.name} />
        ))}
      </div>
    </div>
  )
}
