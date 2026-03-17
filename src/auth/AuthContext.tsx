import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth } from '../firebase'

const googleProvider = new GoogleAuthProvider()

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/** Check if E2E mock auth is requested via URL parameter (dev mode only) */
function isE2EMockAuth(): boolean {
  if (!import.meta.env.DEV) return false
  const params = new URLSearchParams(window.location.search)
  return params.get('e2e') === 'mock'
}

/** Create a minimal mock user for E2E testing */
function createMockUser(): User {
  return {
    uid: 'e2e-test-uid',
    email: 'test@missiondeck.dev',
    displayName: 'E2E Test User',
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    providerId: 'firebase',
    refreshToken: '',
    tenantId: null,
    phoneNumber: null,
    photoURL: null,
    delete: () => Promise.resolve(),
    getIdToken: () => Promise.resolve('mock-token'),
    getIdTokenResult: () =>
      Promise.resolve({} as Awaited<ReturnType<User['getIdTokenResult']>>),
    reload: () => Promise.resolve(),
    toJSON: () => ({}),
  } as User
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // E2E mock auth bypass: skip Firebase auth entirely
    if (isE2EMockAuth()) {
      setUser(createMockUser())
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed'
      setError(message)
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign out failed'
      setError(message)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
