/**
 * Creates a test user in Firebase Auth for E2E / dev testing.
 * Usage: npx tsx scripts/create-test-user.ts
 *
 * Writes credentials to .env.test.local (gitignored).
 */
import { initializeApp, cert, deleteApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const TEST_EMAIL = 'testuser@missiondeck.dev'
const TEST_PASSWORD = 'MissionDeck-Test-2026!'
const TEST_DISPLAY_NAME = 'Test User'

async function main() {
  const serviceAccountPath = resolve(import.meta.dirname, '..', 'service-account.json')
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'))

  const app = initializeApp({
    credential: cert(serviceAccount),
  })

  const auth = getAuth(app)

  // Check if user already exists
  let uid: string
  try {
    const existing = await auth.getUserByEmail(TEST_EMAIL)
    uid = existing.uid
    console.log(`Test user already exists: ${existing.uid}`)
  } catch {
    // User doesn't exist — create it
    const user = await auth.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      displayName: TEST_DISPLAY_NAME,
      emailVerified: true,
    })
    uid = user.uid
    console.log(`Created test user: ${user.uid}`)
  }

  // Write credentials to .env.test.local
  const envPath = resolve(import.meta.dirname, '..', '.env.test.local')
  const envContent = [
    '# Firebase test user credentials (auto-generated, gitignored)',
    `TEST_USER_EMAIL=${TEST_EMAIL}`,
    `TEST_USER_PASSWORD=${TEST_PASSWORD}`,
    `TEST_USER_UID=${uid}`,
    '',
  ].join('\n')

  writeFileSync(envPath, envContent)
  console.log(`Credentials written to .env.test.local`)

  await deleteApp(app)
}

main().catch((err) => {
  console.error('Failed to create test user:', err)
  process.exit(1)
})
