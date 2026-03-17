import { test, expect } from '@playwright/test'

test.describe('Mission Deck - Authenticated Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?e2e=mock', { waitUntil: 'networkidle' })
  })

  test('dashboard loads instead of login page', async ({ page }) => {
    await expect(page.locator('button', { hasText: 'Sign in with Google' })).not.toBeVisible()
    await expect(page.locator('h1', { hasText: 'Mission Deck' })).toBeVisible()
  })

  test('header shows user email and sign out button', async ({ page }) => {
    await expect(page.locator('text=test@missiondeck.dev')).toBeVisible()
    await expect(page.locator('button', { hasText: 'Sign out' })).toBeVisible()
  })

  test('header shows seed demo data button', async ({ page }) => {
    const seedButton = page.locator('button', { hasText: /Seed Demo Data|Reset Demo Data/ })
    await expect(seedButton).toBeVisible()
  })

  test('all three team panels render', async ({ page }) => {
    await expect(page.locator('[data-testid="team-panel-t01"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="team-panel-t02"]')).toBeVisible()
    await expect(page.locator('[data-testid="team-panel-t03"]')).toBeVisible()
  })

  test('team panels display team names from config', async ({ page }) => {
    const firstPanel = page.locator('[data-testid="team-panel-t01"]')
    await expect(firstPanel).toBeVisible({ timeout: 10000 })
    const heading = firstPanel.locator('h2')
    await expect(heading).toBeVisible()
    await expect(heading).not.toHaveText('')
  })

  test('team panels contain expected sections', async ({ page }) => {
    const panel = page.locator('[data-testid="team-panel-t01"]')
    await expect(panel).toBeVisible({ timeout: 10000 })
    await expect(panel.getByRole('heading', { name: 'Preview' })).toBeVisible()
    await expect(panel.getByRole('heading', { name: 'Prompts' })).toBeVisible()
    await expect(panel.getByRole('heading', { name: 'Terminal' })).toBeVisible()
    await expect(panel.getByRole('heading', { name: 'Artifacts' })).toBeVisible()
    await expect(panel.getByRole('heading', { name: 'JP Rocks Agents' })).toBeVisible()
  })

  test('team count indicator shows in header', async ({ page }) => {
    await expect(page.locator('text=3 teams')).toBeVisible()
  })

  test('no unexpected console errors on authenticated page', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    await page.goto('/?e2e=mock', { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)
    const unexpectedErrors = errors.filter(
      (e) =>
        !e.includes('auth') &&
        !e.includes('Auth') &&
        !e.includes('Firebase') &&
        !e.includes('firebase') &&
        !e.includes('PERMISSION_DENIED') &&
        !e.includes('permission_denied')
    )
    expect(unexpectedErrors).toHaveLength(0)
  })
})
