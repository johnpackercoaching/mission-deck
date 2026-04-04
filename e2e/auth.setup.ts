/**
 * Playwright global setup: signs in with the real Firebase test user
 * and saves browser auth state so all tests start authenticated.
 *
 * Reads credentials from .env.test.local (gitignored).
 */
import { test as setup, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const AUTH_FILE = resolve(import.meta.dirname, '..', '.auth', 'user.json')

/** Parse .env.test.local into a key-value map */
function loadEnv(): Record<string, string> {
  const envPath = resolve(import.meta.dirname, '..', '.env.test.local')
  const content = readFileSync(envPath, 'utf-8')
  const env: Record<string, string> = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const [key, ...rest] = trimmed.split('=')
    env[key] = rest.join('=')
  }
  return env
}

setup('authenticate via Firebase', async ({ page }) => {
  const env = loadEnv()
  const email = env.TEST_USER_EMAIL
  const password = env.TEST_USER_PASSWORD

  if (!email || !password) {
    throw new Error('Missing TEST_USER_EMAIL or TEST_USER_PASSWORD in .env.test.local')
  }

  // Navigate to the app so we have access to the Firebase SDK in the browser
  await page.goto('/', { waitUntil: 'networkidle' })

  // Sign in using Firebase client SDK from within the browser context
  const result = await page.evaluate(
    async ({ email, password }) => {
      // Access the Firebase auth instance from the app's global scope
      const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth')
      const auth = getAuth()
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password)
        return { success: true, uid: cred.user.uid }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    },
    { email, password }
  )

  if (!result.success) {
    throw new Error(`Firebase sign-in failed: ${result.error}`)
  }

  // Wait for the app to react to the auth state change
  await expect(page.locator('button', { hasText: 'Sign out' })).toBeVisible({ timeout: 10000 })

  // Save the authenticated browser state (cookies, localStorage, indexedDB auth tokens)
  await page.context().storageState({ path: AUTH_FILE })
})
