import { useEffect, useState } from 'react'
import { ref, onValue, set, remove, off } from 'firebase/database'
import { rtdb } from '../firebase'
import { RTDB_PREFIX } from '../config'
import type { ZodType } from 'zod'

// ---------- E2E Mock Detection ----------
function isE2EMockAuth(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const params = new URLSearchParams(window.location.search)
    return params.get('e2e') === 'mock'
  } catch {
    return false
  }
}

const USE_MOCK = isE2EMockAuth()

// ---------- In-Memory Mock Store (for E2E tests) ----------
// A simple reactive store that mimics Firebase RTDB behavior:
// - Nested object tree addressed by slash-separated paths
// - Listeners fire on write/remove for any path that overlaps

const mockStore: Record<string, unknown> = {}
const mockListeners = new Map<string, Set<(data: unknown) => void>>()

function getNestedValue(obj: Record<string, unknown>, segments: string[]): unknown {
  let current: unknown = obj
  for (const seg of segments) {
    if (current === null || current === undefined || typeof current !== 'object') return null
    current = (current as Record<string, unknown>)[seg]
  }
  return current ?? null
}

function setNestedValue(obj: Record<string, unknown>, segments: string[], value: unknown): void {
  if (segments.length === 0) return
  let current = obj
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i]!
    if (!(seg in current) || typeof current[seg] !== 'object' || current[seg] === null) {
      current[seg] = {}
    }
    current = current[seg] as Record<string, unknown>
  }
  const last = segments[segments.length - 1]!
  current[last] = value
}

function deleteNestedValue(obj: Record<string, unknown>, segments: string[]): void {
  if (segments.length === 0) return
  let current = obj
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i]!
    if (!(seg in current) || typeof current[seg] !== 'object' || current[seg] === null) return
    current = current[seg] as Record<string, unknown>
  }
  const last = segments[segments.length - 1]!
  delete current[last]
}

function pathSegments(fullPath: string): string[] {
  return fullPath.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean)
}

function notifyMockListeners(changedPath: string): void {
  // Notify exact path listeners
  for (const [listenerPath, callbacks] of mockListeners) {
    // A listener at path P is affected if:
    // 1. changedPath starts with P (data under P changed)
    // 2. P starts with changedPath (ancestor data changed)
    // 3. They are the same path
    if (
      changedPath === listenerPath ||
      changedPath.startsWith(listenerPath + '/') ||
      listenerPath.startsWith(changedPath + '/')
    ) {
      const segments = pathSegments(listenerPath)
      const value = getNestedValue(mockStore, segments)
      for (const cb of callbacks) {
        cb(value)
      }
    }
  }
}

function mockSubscribe(fullPath: string, callback: (data: unknown) => void): () => void {
  let set = mockListeners.get(fullPath)
  if (!set) {
    set = new Set()
    mockListeners.set(fullPath, set)
  }
  set.add(callback)

  // Fire initial value immediately (async to match Firebase behavior)
  const segments = pathSegments(fullPath)
  const initialValue = getNestedValue(mockStore, segments)
  queueMicrotask(() => callback(initialValue))

  return () => {
    const s = mockListeners.get(fullPath)
    if (s) {
      s.delete(callback)
      if (s.size === 0) {
        mockListeners.delete(fullPath)
      }
    }
  }
}

async function mockWriteData(fullPath: string, value: unknown): Promise<void> {
  const segments = pathSegments(fullPath)
  setNestedValue(mockStore, segments, value)
  notifyMockListeners(fullPath)
}

async function mockRemoveData(fullPath: string): Promise<void> {
  const segments = pathSegments(fullPath)
  deleteNestedValue(mockStore, segments)
  notifyMockListeners(fullPath)
}

// Expose mock write function for E2E tests to inject data
if (USE_MOCK && typeof window !== 'undefined') {
  ;(window as any).__mockWriteData = (path: string, value: unknown) => {
    const segments = pathSegments(path)
    setNestedValue(mockStore, segments, value)
    notifyMockListeners(path)
  }
}

// ---------- Firebase Listener Dedup ----------
const activeListeners = new Map<string, {
  count: number
  unsubscribe: () => void
  callbacks: Set<(data: unknown) => void>
  lastValue: { val: unknown; received: boolean }
}>()

function getFullPath(path: string): string {
  return `${RTDB_PREFIX}/${path}`.replace(/\/+/g, '/')
}

// ---------- Public API ----------

export function useData<T>(path: string, schema: ZodType<T>): {
  data: T | null
  loading: boolean
  error: string | null
} {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fullPath = getFullPath(path)

    const callback = (raw: unknown) => {
      if (raw === null || raw === undefined) {
        setData(null)
        setLoading(false)
        setError(null)
        return
      }
      const result = schema.safeParse(raw)
      if (result.success) {
        setData(result.data)
        setError(null)
      } else {
        console.error(`[data] Validation failed for ${fullPath}:`, result.error.message)
        setError(`Validation failed: ${result.error.message}`)
        setData(null)
      }
      setLoading(false)
    }

    // --- Mock mode: use in-memory store ---
    if (USE_MOCK) {
      return mockSubscribe(fullPath, callback)
    }

    // --- Real Firebase mode ---
    const existing = activeListeners.get(fullPath)
    if (existing) {
      existing.count++
      existing.callbacks.add(callback)
      // Replay last value so new subscribers get current state immediately
      if (existing.lastValue.received) {
        queueMicrotask(() => callback(existing.lastValue.val))
      }
    } else {
      const dbRef = ref(rtdb, fullPath)
      const callbacks = new Set<(data: unknown) => void>([callback])
      const unsubscribe = () => off(dbRef)
      const lastValue = { val: undefined as unknown, received: false }

      onValue(dbRef, (snapshot) => {
        const val = snapshot.val()
        lastValue.val = val
        lastValue.received = true
        for (const cb of callbacks) {
          cb(val)
        }
      }, (err) => {
        console.error(`[data] Firebase error for ${fullPath}:`, err.message)
        lastValue.val = null
        lastValue.received = true
        for (const cb of callbacks) {
          cb(null)
        }
      })

      activeListeners.set(fullPath, { count: 1, unsubscribe, callbacks, lastValue })
    }

    return () => {
      const entry = activeListeners.get(fullPath)
      if (entry) {
        entry.callbacks.delete(callback)
        entry.count--
        if (entry.count <= 0) {
          entry.unsubscribe()
          activeListeners.delete(fullPath)
        }
      }
    }
  }, [path, schema])

  return { data, loading, error }
}

export async function writeData(path: string, value: unknown): Promise<void> {
  const fullPath = getFullPath(path)
  if (USE_MOCK) {
    return mockWriteData(fullPath, value)
  }
  const dbRef = ref(rtdb, fullPath)
  await set(dbRef, value)
}

export async function removeData(path: string): Promise<void> {
  const fullPath = getFullPath(path)
  if (USE_MOCK) {
    return mockRemoveData(fullPath)
  }
  const dbRef = ref(rtdb, fullPath)
  await remove(dbRef)
}
