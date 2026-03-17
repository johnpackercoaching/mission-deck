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
    await page.goto('/')
    const signInButton = page.locator('button', { hasText: 'Sign in with Google' })
    const hasSignIn = await signInButton.isVisible().catch(() => false)
    const hasTeamPanel = await page.locator('[data-testid^="team-panel-"]').first().isVisible().catch(() => false)
    expect(hasSignIn || hasTeamPanel).toBe(true)
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
