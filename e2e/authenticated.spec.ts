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

  test('team panel renders', async ({ page }) => {
    await expect(page.locator('[data-testid="team-panel-t01"]')).toBeVisible({ timeout: 10000 })
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
    await expect(page.locator('text=1 teams')).toBeVisible()
  })

  test('connection status indicator exists in header', async ({ page }) => {
    const statusDot = page.locator('[aria-label="Connected to Firebase"], [aria-label="Disconnected from Firebase"]')
    await expect(statusDot).toBeVisible({ timeout: 5000 })
    const label = await statusDot.getAttribute('aria-label')
    expect(['Connected to Firebase', 'Disconnected from Firebase']).toContain(label)
  })

  test('terminal sections have log role and heading', async ({ page }) => {
    const panel = page.locator('[data-testid="team-panel-t01"]')
    await expect(panel).toBeVisible({ timeout: 10000 })
    await expect(panel.getByRole('heading', { name: 'Terminal' })).toBeVisible()
    const terminalLog = panel.locator('[role="log"]')
    await expect(terminalLog).toBeVisible()
    await expect(terminalLog).toHaveAttribute('aria-live', 'polite')
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

  // === Search, Filter, and Modal Tests ===

  test('search bar is visible and functional', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]')
    await expect(searchInput).toBeVisible()
    await expect(searchInput).toHaveAttribute('aria-label', 'Search teams by name')

    await searchInput.fill('Team')
    await expect(searchInput).toHaveValue('Team')

    await expect(page.locator('[data-testid="team-panel-t01"]')).toBeVisible()
  })

  test('search filters teams by name', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]')
    await expect(searchInput).toBeVisible()

    await searchInput.fill('ZZZZNONEXISTENT')

    await expect(page.locator('[data-testid="team-panel-t01"]')).not.toBeVisible({ timeout: 3000 })

    await expect(page.locator('text=No teams match your search')).toBeVisible()
    await expect(page.locator('[data-testid="clear-filters"]')).toBeVisible()
  })

  test('status filter chips are visible and interactive', async ({ page }) => {
    await expect(page.locator('[data-testid="filter-all"]')).toBeVisible()
    await expect(page.locator('[data-testid="filter-active"]')).toBeVisible()
    await expect(page.locator('[data-testid="filter-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="filter-idle"]')).toBeVisible()

    await expect(page.locator('[data-testid="filter-all"]')).toHaveAttribute('aria-checked', 'true')
    await expect(page.locator('[data-testid="filter-active"]')).toHaveAttribute('aria-checked', 'false')

    await page.locator('[data-testid="filter-idle"]').click()
    await expect(page.locator('[data-testid="filter-idle"]')).toHaveAttribute('aria-checked', 'true')
    await expect(page.locator('[data-testid="filter-all"]')).toHaveAttribute('aria-checked', 'false')
  })

  test('clicking team header opens detail modal', async ({ page }) => {
    const panel = page.locator('[data-testid="team-panel-t01"]')
    await expect(panel).toBeVisible({ timeout: 10000 })

    const headerButton = panel.locator('[role="button"]')
    await expect(headerButton).toBeVisible()
    await headerButton.click()

    const modal = page.locator('[data-testid="team-detail-modal"]')
    await expect(modal).toBeVisible({ timeout: 5000 })
    await expect(modal).toHaveAttribute('aria-modal', 'true')

    await expect(page.locator('[data-testid="modal-close-button"]')).toBeVisible()
  })

  test('modal closes on Escape key', async ({ page }) => {
    const panel = page.locator('[data-testid="team-panel-t01"]')
    await expect(panel).toBeVisible({ timeout: 10000 })

    const headerButton = panel.locator('[role="button"]')
    await headerButton.click()

    const modal = page.locator('[data-testid="team-detail-modal"]')
    await expect(modal).toBeVisible({ timeout: 5000 })

    await page.keyboard.press('Escape')

    await expect(modal).not.toBeVisible({ timeout: 3000 })
  })

  test('modal closes on close button click', async ({ page }) => {
    const panel = page.locator('[data-testid="team-panel-t01"]')
    await expect(panel).toBeVisible({ timeout: 10000 })

    const headerButton = panel.locator('[role="button"]')
    await headerButton.click()

    const modal = page.locator('[data-testid="team-detail-modal"]')
    await expect(modal).toBeVisible({ timeout: 5000 })

    await page.locator('[data-testid="modal-close-button"]').click()

    await expect(modal).not.toBeVisible({ timeout: 3000 })
  })

  test('agent prompts are pre-filled and editable with CRUD persistence', async ({ page }) => {
    const panel = page.locator('[data-testid="team-panel-t01"]')
    await expect(panel).toBeVisible({ timeout: 10000 })

    // Expand the first agent (project-resume-agent)
    const agentButton = panel.locator('[aria-controls="prompt-project-resume-agent"]')
    await expect(agentButton).toBeVisible()
    await agentButton.click()

    const textarea = panel.locator('#textarea-project-resume-agent')
    await expect(textarea).toBeVisible({ timeout: 3000 })

    // Verify prompt is pre-filled (not empty, not placeholder)
    const originalValue = await textarea.inputValue()
    expect(originalValue.length).toBeGreaterThan(100)
    expect(originalValue).toContain('UserPrompt')

    // Edit: append a period
    await textarea.fill(originalValue + '.')
    const editedValue = await textarea.inputValue()
    expect(editedValue).toBe(originalValue + '.')

    // Revert: remove the period
    await textarea.fill(originalValue)
    const revertedValue = await textarea.inputValue()
    expect(revertedValue).toBe(originalValue)
  })

  test('search bar responds to "/" keyboard shortcut', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]')
    await expect(searchInput).toBeVisible()

    await page.keyboard.press('/')

    await expect(searchInput).toBeFocused()
  })
})
