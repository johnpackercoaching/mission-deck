import { useMemo } from 'react'
import { z } from 'zod'
import { useData } from '../services/data'

export interface TeamListEntry {
  id: string
  name: string
}

const TeamsRecordSchema = z.record(
  z.string(),
  z.object({ name: z.string() }).passthrough()
)

export function useTeamList(): { teams: TeamListEntry[]; loading: boolean } {
  const { data, loading } = useData('teams', TeamsRecordSchema)

  const teams = useMemo(() => {
    if (!data) return []
    return Object.entries(data)
      .map(([id, val]) => ({ id, name: val.name }))
      .sort((a, b) => a.id.localeCompare(b.id))
  }, [data])

  return { teams, loading }
}
