import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
  const { signInWithGoogle, error } = useAuth()

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold text-neutral-100">Mission Deck</h1>
        <p className="text-neutral-400">Hackathon Mission Control</p>
        <button
          onClick={() => void signInWithGoogle()}
          className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded border border-neutral-700 text-sm transition-colors"
        >
          Sign in with Google
        </button>
        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}
      </div>
    </div>
  )
}
