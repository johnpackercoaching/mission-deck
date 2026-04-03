import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
  const { signInWithGoogle, signInWithEmail, error } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setIsSubmitting(true)
    await signInWithEmail(email, password)
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center relative overflow-hidden">
      {/* Subtle background grid effect */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
        aria-hidden="true"
      />

      {/* Radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.06]"
        style={{
          background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 text-center space-y-8 animate-fade-in">
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-bold text-neutral-100 tracking-tight">
            Mission Deck
          </h1>
          <p className="text-neutral-400 text-lg">
            Hackathon Mission Control
          </p>
          <p className="text-neutral-600 text-sm max-w-sm mx-auto">
            Real-time team dashboards, agent orchestration, and live terminal output -- all in one place.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => void signInWithGoogle()}
            className="focus-ring group relative inline-flex items-center gap-2 px-8 py-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 rounded-lg border border-neutral-700 hover:border-neutral-600 text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-neutral-900/50"
            aria-label="Sign in with Google"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Sign in with Google</span>
            <span className="absolute inset-0 rounded-lg bg-white/0 group-hover:bg-white/[0.02] transition-colors duration-200" aria-hidden="true" />
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 max-w-xs mx-auto">
          <div className="flex-1 h-px bg-neutral-800" />
          <span className="text-neutral-600 text-xs uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-neutral-800" />
        </div>

        {/* Email/Password form */}
        <form onSubmit={(e) => void handleEmailSignIn(e)} className="space-y-3 max-w-xs mx-auto">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-200 text-sm placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            aria-label="Email address"
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-200 text-sm placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            aria-label="Password"
            autoComplete="current-password"
          />
          <button
            type="submit"
            disabled={isSubmitting || !email || !password}
            className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-lg text-sm font-medium transition-colors duration-200"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {error && (
          <div className="animate-fade-in" role="alert">
            <p className="text-red-400 text-sm bg-red-950/30 border border-red-900/50 rounded-lg px-4 py-2 inline-block">
              {error}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
