import { test, expect, type Page } from '@playwright/test'

/** Helper: create a team via the UI and wait for it to appear */
async function createTeam(page: Page, name: string): Promise<void> {
  await page.locator('[data-testid="create-team-button"]').click()
  const dialog = page.locator('[data-testid="create-team-dialog"]')
  await expect(dialog).toBeVisible({ timeout: 5000 })
  await page.locator('[data-testid="create-team-name-input"]').fill(name)
  await page.locator('[data-testid="create-team-submit"]').click()
  await expect(dialog).not.toBeVisible({ timeout: 5000 })
}

/** Helper: delete a team by its tab delete button and confirm */
async function deleteTeamByTab(page: Page, teamId: string): Promise<void> {
  const deleteBtn = page.locator(`[data-testid="delete-team-${teamId}"]`)
  // Hover the tab to reveal the delete button
  await deleteBtn.dispatchEvent('click')
  const confirmDialog = page.locator('[data-testid="delete-team-dialog"]')
  await expect(confirmDialog).toBeVisible({ timeout: 5000 })
  await page.locator('[data-testid="delete-team-confirm"]').click()
  await expect(confirmDialog).not.toBeVisible({ timeout: 5000 })
}

test.describe('Mission Deck - Authenticated Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?e2e=mock', { waitUntil: 'networkidle' })
    // Wait for the team list to load (either teams appear or empty state)
    await page.waitForSelector('[data-testid="team-tab-all"], [data-testid="empty-state"]', { timeout: 10000 })
  })

  test('dashboard loads instead of login page', async ({ page }) => {
    await expect(page.locator('button', { hasText: 'Sign in with Google' })).not.toBeVisible()
    await expect(page.locator('h1', { hasText: 'Mission Deck' })).toBeVisible()
  })

  test('header shows user email and sign out button', async ({ page }) => {
    await expect(page.locator('text=test@missiondeck.dev')).toBeVisible()
    await expect(page.locator('button', { hasText: 'Sign out' })).toBeVisible()
  })

  test('create team dialog opens and closes', async ({ page }) => {
    await page.locator('[data-testid="create-team-button"]').click()
    const dialog = page.locator('[data-testid="create-team-dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // Cancel closes dialog
    await page.locator('[data-testid="create-team-cancel"]').click()
    await expect(dialog).not.toBeVisible({ timeout: 3000 })
  })

  test('creating a team adds it to the dashboard', async ({ page }) => {
    await createTeam(page, 'Test Alpha')

    // The new team should appear as a tab
    const tabs = page.locator('[role="tab"]')
    const tabTexts = await tabs.allTextContents()
    const hasTeam = tabTexts.some(t => t.includes('Test Alpha'))
    expect(hasTeam).toBe(true)
  })

  test('deleting a team removes it from the dashboard', async ({ page }) => {
    await createTeam(page, 'Team To Delete')

    // Find the newly created team's tab by looking for its text
    const tabs = page.locator('[role="tab"]')
    const allTabs = await tabs.all()
    let newTeamId: string | null = null
    for (const tab of allTabs) {
      const text = await tab.textContent()
      const testid = await tab.getAttribute('data-testid')
      if (text?.includes('Team To Delete') && testid?.startsWith('team-tab-')) {
        newTeamId = testid.replace('team-tab-', '')
        break
      }
    }
    expect(newTeamId).not.toBeNull()

    // Go back to All view first
    await page.locator('[data-testid="team-tab-all"]').click()

    // Delete the team
    await deleteTeamByTab(page, newTeamId!)

    // Verify team tab is gone
    await expect(page.locator(`[data-testid="team-tab-${newTeamId}"]`)).not.toBeVisible({ timeout: 5000 })
  })

  test('delete cancel keeps the team', async ({ page }) => {
    await createTeam(page, 'Team Keep Me')

    // Find the team ID
    const tabs = page.locator('[role="tab"]')
    const allTabs = await tabs.all()
    let teamId: string | null = null
    for (const tab of allTabs) {
      const text = await tab.textContent()
      const testid = await tab.getAttribute('data-testid')
      if (text?.includes('Team Keep Me') && testid?.startsWith('team-tab-')) {
        teamId = testid.replace('team-tab-', '')
        break
      }
    }
    expect(teamId).not.toBeNull()

    // Go back to All view
    await page.locator('[data-testid="team-tab-all"]').click()

    // Click delete button
    await page.locator(`[data-testid="delete-team-${teamId}"]`).dispatchEvent('click')
    const confirmDialog = page.locator('[data-testid="delete-team-dialog"]')
    await expect(confirmDialog).toBeVisible({ timeout: 5000 })

    // Click Cancel
    await page.locator('[data-testid="delete-team-cancel"]').click()
    await expect(confirmDialog).not.toBeVisible({ timeout: 3000 })

    // Team should still be there
    await expect(page.locator(`[data-testid="team-tab-${teamId}"]`)).toBeVisible()
  })

  test('empty state shows create CTA when no teams exist', async ({ page }) => {
    // This test checks the empty state element if visible, or the create button exists
    const emptyState = page.locator('[data-testid="empty-state"]')
    const createButton = page.locator('[data-testid="create-team-button"]')

    // At least one of these should be available
    const emptyVisible = await emptyState.isVisible().catch(() => false)
    if (emptyVisible) {
      await expect(page.locator('[data-testid="empty-state-create"]')).toBeVisible()
    } else {
      // If teams exist, just verify the create button works
      await expect(createButton).toBeVisible()
    }
  })

  test('search bar is visible and functional when teams exist', async ({ page }) => {
    // Create a team if needed so search bar shows
    const createBtn = page.locator('[data-testid="create-team-button"]')
    await expect(createBtn).toBeVisible({ timeout: 5000 })

    // Ensure at least one team exists
    const emptyState = page.locator('[data-testid="empty-state"]')
    if (await emptyState.isVisible().catch(() => false)) {
      await createTeam(page, 'Search Test Team')
      await page.locator('[data-testid="team-tab-all"]').click()
    }

    const searchInput = page.locator('[data-testid="search-input"]')
    await expect(searchInput).toBeVisible({ timeout: 5000 })
    await expect(searchInput).toHaveAttribute('aria-label', 'Search teams by name')

    await searchInput.fill('Team')
    await expect(searchInput).toHaveValue('Team')
  })

  test('status filter chips are visible and interactive', async ({ page }) => {
    // Ensure at least one team exists
    const emptyState = page.locator('[data-testid="empty-state"]')
    if (await emptyState.isVisible().catch(() => false)) {
      await createTeam(page, 'Filter Test Team')
      await page.locator('[data-testid="team-tab-all"]').click()
    }

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

  test('clicking team tab switches to focused single-team view', async ({ page }) => {
    // Create a team to focus on
    await createTeam(page, 'Focus View Team')

    // Find the new team tab
    const tabs = page.locator('[role="tab"]')
    const allTabs = await tabs.all()
    let teamId: string | null = null
    for (const tab of allTabs) {
      const text = await tab.textContent()
      const testid = await tab.getAttribute('data-testid')
      if (text?.includes('Focus View Team') && testid?.startsWith('team-tab-')) {
        teamId = testid.replace('team-tab-', '')
        break
      }
    }
    expect(teamId).not.toBeNull()

    // After creation, we're already in focused view. Verify.
    await expect(page.locator('[data-testid="team-tab-all"]')).toHaveAttribute('aria-selected', 'false')
    await expect(page.locator(`[data-testid="team-tab-${teamId}"]`)).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('text=Viewing')).toBeVisible()
  })

  test('search bar is hidden in focused view and visible in grid view', async ({ page }) => {
    await createTeam(page, 'View Toggle Team')

    // In focused view, search should be hidden
    await expect(page.locator('[data-testid="search-input"]')).not.toBeVisible()

    // Switch back to All view
    await page.locator('[data-testid="team-tab-all"]').click()

    // Search should be visible
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible({ timeout: 5000 })
  })

  test('team panel sections are visible', async ({ page }) => {
    await createTeam(page, 'Sections Test Team')

    // In focused view, wait for team panel
    const panel = page.locator('[data-testid^="team-panel-"]').first()
    await expect(panel).toBeVisible({ timeout: 10000 })

    await expect(panel.getByRole('heading', { name: 'Preview' })).toBeVisible()
    await expect(panel.getByRole('heading', { name: 'Prompts' })).toBeVisible()
    await expect(panel.getByRole('heading', { name: 'Terminal' })).toBeVisible()
    await expect(panel.getByRole('heading', { name: 'Artifacts' })).toBeVisible()
    await expect(panel.getByRole('heading', { name: 'JP Rocks Agents' })).toBeVisible()
  })

  test('clicking team header opens detail modal and closes on Escape', async ({ page }) => {
    await createTeam(page, 'Modal Test Team')

    // Go back to All view to see the grid
    await page.locator('[data-testid="team-tab-all"]').click()

    const panel = page.locator('[data-testid^="team-panel-"]').first()
    await expect(panel).toBeVisible({ timeout: 10000 })

    const headerButton = panel.locator('[role="button"]')
    await expect(headerButton).toBeVisible()
    await headerButton.click()

    const modal = page.locator('[data-testid="team-detail-modal"]')
    await expect(modal).toBeVisible({ timeout: 5000 })
    await expect(modal).toHaveAttribute('aria-modal', 'true')

    await page.keyboard.press('Escape')
    await expect(modal).not.toBeVisible({ timeout: 3000 })
  })

  test('"/" keyboard shortcut focuses search', async ({ page }) => {
    // Ensure at least one team so search bar is visible
    const emptyState = page.locator('[data-testid="empty-state"]')
    if (await emptyState.isVisible().catch(() => false)) {
      await createTeam(page, 'Shortcut Test')
      await page.locator('[data-testid="team-tab-all"]').click()
    }

    const searchInput = page.locator('[data-testid="search-input"]')
    await expect(searchInput).toBeVisible({ timeout: 5000 })

    await page.keyboard.press('/')
    await expect(searchInput).toBeFocused()
  })

  test('team selector has correct ARIA tablist attributes', async ({ page }) => {
    const tablist = page.locator('[role="tablist"]')
    await expect(tablist).toBeVisible()
    await expect(tablist).toHaveAttribute('aria-label', 'Select team to monitor')

    await expect(page.locator('[role="tabpanel"]')).toBeVisible()
  })

  test('connection status indicator exists in header', async ({ page }) => {
    const statusDot = page.locator('[aria-label="Connected to Firebase"], [aria-label="Disconnected from Firebase"]')
    await expect(statusDot).toBeVisible({ timeout: 5000 })
    const label = await statusDot.getAttribute('aria-label')
    expect(['Connected to Firebase', 'Disconnected from Firebase']).toContain(label)
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
