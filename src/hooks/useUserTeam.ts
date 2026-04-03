import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useData, writeData } from '../services/data'

/**
 * Hook that manages a single team per user.
 * - On first sign-in, auto-creates the team at `teams/{uid}`
 * - Returns the team ID (always the user's uid) and loading state
 */

const TeamExistsSchema = z.object({ name: z.string() }).passthrough()

export function useUserTeam(uid: string): { teamId: string; loading: boolean } {
  const teamId = uid
  const { data, loading: dataLoading } = useData(`teams/${teamId}`, TeamExistsSchema)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    // Once we know the data has loaded and there's no team yet, create one
    if (!dataLoading && data === null && !creating) {
      setCreating(true)
      writeData(`teams/${teamId}`, {
        name: 'My Team',
        project: { previewUrl: '', prompts: {} },
        terminal: { lines: {} },
        artifacts: {},
        agents: {},
        timeline: {},
      }).then(() => {
        setCreating(false)
      }).catch((err) => {
        console.error('Failed to auto-create team:', err)
        setCreating(false)
      })
    }
  }, [dataLoading, data, creating, teamId])

  return { teamId, loading: dataLoading || creating || data === null }
}
