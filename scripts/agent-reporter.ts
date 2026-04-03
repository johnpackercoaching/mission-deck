import { initializeApp, cert, deleteApp, type App } from 'firebase-admin/app'
import { getDatabase, type Database } from 'firebase-admin/database'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DATABASE_URL = 'https://mission-deck-app-default-rtdb.firebaseio.com'
const RTDB_PREFIX = '/mission-deck'

let app: App | null = null
let db: Database | null = null
let currentTeamId: string = ''

export function initReporter(teamId: string): void {
  currentTeamId = teamId

  if (app) return

  const serviceAccountPath = resolve(import.meta.dirname, '..', 'service-account.json')
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'))

  app = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: DATABASE_URL,
  })

  db = getDatabase(app)
}

function getDb(): Database {
  if (!db) throw new Error('initReporter() must be called before any report function')
  return db
}

function teamPath(subpath: string): string {
  return `${RTDB_PREFIX}/teams/${currentTeamId}/${subpath}`
}

export async function reportTeamName(name: string): Promise<void> {
  await getDb().ref(teamPath('name')).set(name)
}

export async function reportAgentStatus(
  agentId: string,
  status: 'idle' | 'active' | 'complete' | 'error',
  name: string,
  systemPrompt?: string,
): Promise<void> {
  const data: Record<string, unknown> = {
    status,
    name,
    lastActivity: Date.now(),
  }
  if (systemPrompt !== undefined) {
    data.systemPrompt = systemPrompt
  }
  await getDb().ref(teamPath(`agents/${agentId}`)).set(data)
}

export async function reportTerminalLine(
  text: string,
  type: 'stdout' | 'stderr' | 'system',
): Promise<void> {
  await getDb().ref(teamPath('terminal/lines')).push({
    text,
    type,
    timestamp: Date.now(),
  })
}

export async function reportArtifact(
  name: string,
  path: string,
  type: string,
): Promise<void> {
  await getDb().ref(teamPath('artifacts')).push({
    name,
    path,
    type,
    createdAt: Date.now(),
  })
}

export async function reportPreviewUrl(url: string): Promise<void> {
  await getDb().ref(teamPath('project/previewUrl')).set(url)
}

export async function cleanup(): Promise<void> {
  if (app) {
    await deleteApp(app)
    app = null
    db = null
  }
}
