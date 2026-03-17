import { writeData, readData } from '../services/data'
import { SEED_TEAMS } from './seed-data'

export async function seedDatabase(): Promise<void> {
  const teams = SEED_TEAMS()
  const writes: Promise<void>[] = []

  for (const [teamId, data] of Object.entries(teams)) {
    writes.push(writeData(`teams/${teamId}`, data))
  }

  await Promise.all(writes)
}

export async function checkDataExists(): Promise<boolean> {
  const data = await readData('teams')
  return data !== null && data !== undefined
}
