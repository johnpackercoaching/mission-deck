import { test, expect } from '@playwright/test'

test.describe('Mission Deck - Authenticated Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?e2e=mock', { waitUntil: 'networkidle' })
    // Wait for the team panel to load
    await page.waitForSelector('[data-testid^="team-panel-"]', { timeout: 15000 })
  })

  test('dashboard loads instead of login page', async ({ page }) => {
    await expect(page.locator('button', { hasText: 'Sign in with Google' })).not.toBeVisible()
    await expect(page.locator('h1', { hasText: 'Mission Deck' })).toBeVisible()
  })

  test('header shows user email and sign out button', async ({ page }) => {
    await expect(page.locator('text=testuser@missiondeck.dev')).toBeVisible()
    await expect(page.locator('button', { hasText: 'Sign out' })).toBeVisible()
  })

  test('team panel renders with team name', async ({ page }) => {
    const panel = page.locator('[data-testid^="team-panel-"]').first()
    await expect(panel).toBeVisible()
    await expect(panel.locator('h2')).toContainText('My Team')
  })

  test('team panel sections are visible', async ({ page }) => {
    const panel = page.locator('[data-testid^="team-panel-"]').first()
    await expect(panel).toBeVisible()
    await expect(panel.getByRole('heading', { name: 'Preview' })).toBeVisible()
    await expect(panel.getByRole('heading', { name: 'Prompts' })).toBeVisible()
    await expect(panel.getByRole('heading', { name: 'Terminal' })).toBeVisible()
    await expect(panel.getByRole('heading', { name: 'Artifacts' })).toBeVisible()
    await expect(panel.getByRole('heading', { name: 'JP Rocks Agents' })).toBeVisible()
  })

  test('connection status indicator exists in header', async ({ page }) => {
    const statusDot = page.locator('[aria-label="Connected to Firebase"], [aria-label="Disconnected from Firebase"]')
    await expect(statusDot).toBeVisible({ timeout: 5000 })
  })

  test('timeline section is visible in team panel', async ({ page }) => {
    const panel = page.locator('[data-testid^="team-panel-"]').first()
    await expect(panel).toBeVisible()
    const timeline = panel.locator('[data-testid="timeline-section"]')
    await expect(timeline).toBeVisible()
    await expect(timeline).toHaveAttribute('aria-label', 'Agent timeline')
  })

  test('timeline shows empty state when no events exist', async ({ page }) => {
    const panel = page.locator('[data-testid^="team-panel-"]').first()
    await expect(panel).toBeVisible()
    const emptyMsg = panel.locator('[data-testid="timeline-empty"]')
    await expect(emptyMsg).toBeVisible()
    await expect(emptyMsg).toContainText('No timeline events yet')
  })

  test('timeline filter buttons are visible and interactive', async ({ page }) => {
    const panel = page.locator('[data-testid^="team-panel-"]').first()
    await expect(panel).toBeVisible()
    const filter = panel.locator('[data-testid="timeline-filter"]')
    await filter.scrollIntoViewIfNeeded()
    await expect(filter).toBeVisible()
    const rangeAll = panel.locator('[data-testid="timeline-range-all"]')
    const range1h = panel.locator('[data-testid="timeline-range-1h"]')
    await expect(rangeAll).toBeVisible()
    await expect(range1h).toBeVisible()
    // Default is "all" selected
    await expect(rangeAll).toHaveAttribute('aria-checked', 'true')
    // Click a different range
    await range1h.dispatchEvent('click')
    await expect(range1h).toHaveAttribute('aria-checked', 'true')
    await expect(rangeAll).toHaveAttribute('aria-checked', 'false')
  })

  test('timeline collapse/expand toggle works', async ({ page }) => {
    const panel = page.locator('[data-testid^="team-panel-"]').first()
    await expect(panel).toBeVisible()
    const timeline = panel.locator('[data-testid="timeline-section"]')
    const toggleBtn = timeline.locator('button[aria-expanded]').first()
    await toggleBtn.scrollIntoViewIfNeeded()
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'true')
    // Collapse
    await toggleBtn.dispatchEvent('click')
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false')
    await expect(panel.locator('[data-testid="timeline-event-list"]')).not.toBeVisible()
    // Expand
    await toggleBtn.dispatchEvent('click')
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'true')
    await expect(panel.locator('[data-testid="timeline-event-list"]')).toBeVisible()
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
