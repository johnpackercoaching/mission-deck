import { useData } from '../services/data'
import { TEAMS } from '../config'
import { z } from 'zod'

const TeamNameSchema = z.object({
  name: z.string(),
}).passthrough()

interface TeamNameEntry {
  id: string
  configName: string
  rtdbName: string | null
}

export function useTeamNames(): TeamNameEntry[] {
  // TEAMS is a static constant — hook count is stable across renders
  return TEAMS.map((team) => {
    const { data } = useData(`teams/${team.id}`, TeamNameSchema)
    return {
      id: team.id,
      configName: team.name,
      rtdbName: data?.name ?? null,
    }
  })
}
