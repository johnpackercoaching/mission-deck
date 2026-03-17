import { test, expect } from '@playwright/test'

test.describe('Mission Deck', () => {
  test('page loads and shows login or dashboard', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Mission Deck')).toBeVisible()
  })

  test('page has correct title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle('Mission Deck')
  })

  test('login page has Google sign-in button', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    // Wait for Firebase auth to resolve loading state
    await page.waitForFunction(() => {
      const body = document.body.textContent || ''
      return !body.includes('Loading...')
    }, { timeout: 10000 })
    const signInButton = page.locator('button', { hasText: 'Sign in with Google' })
    const teamPanel = page.locator('[data-testid^="team-panel-"]').first()
    // Either the login button or a team panel should be visible after auth resolves
    await expect(signInButton.or(teamPanel)).toBeVisible({ timeout: 5000 })
  })

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    await page.goto('/')
    await page.waitForTimeout(2000)
    const unexpectedErrors = errors.filter(
      (e) => !e.includes('auth') && !e.includes('Firebase') && !e.includes('PERMISSION_DENIED')
    )
    expect(unexpectedErrors).toHaveLength(0)
  })
})
