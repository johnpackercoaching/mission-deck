import { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { rtdb } from '../firebase'

export function useConnectionStatus(): boolean {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const connRef = ref(rtdb, '.info/connected')
    const unsubscribe = onValue(connRef, (snapshot) => {
      setConnected(snapshot.val() === true)
    })
    return () => unsubscribe()
  }, [])

  return connected
}
