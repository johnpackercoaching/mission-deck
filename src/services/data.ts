import { useEffect, useState } from 'react'
import { ref, onValue, set, off } from 'firebase/database'
import { rtdb } from '../firebase'
import { RTDB_PREFIX } from '../config'
import type { ZodType } from 'zod'

const activeListeners = new Map<string, {
  count: number
  unsubscribe: () => void
  callbacks: Set<(data: unknown) => void>
}>()

function getFullPath(path: string): string {
  return `${RTDB_PREFIX}/${path}`.replace(/\/+/g, '/')
}

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

    const existing = activeListeners.get(fullPath)
    if (existing) {
      existing.count++
      existing.callbacks.add(callback)
    } else {
      const dbRef = ref(rtdb, fullPath)
      const callbacks = new Set<(data: unknown) => void>([callback])
      const unsubscribe = () => off(dbRef)

      onValue(dbRef, (snapshot) => {
        const val = snapshot.val()
        for (const cb of callbacks) {
          cb(val)
        }
      }, (err) => {
        console.error(`[data] Firebase error for ${fullPath}:`, err.message)
        for (const cb of callbacks) {
          cb(null)
        }
      })

      activeListeners.set(fullPath, { count: 1, unsubscribe, callbacks })
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
  const dbRef = ref(rtdb, fullPath)
  await set(dbRef, value)
}
