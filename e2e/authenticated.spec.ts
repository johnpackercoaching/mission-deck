import { test, expect } from '@playwright/test'

async function createTeam(page: import('@playwright/test').Page, name: string) {
  // Use page.evaluate for all interactions — Playwright's click() hangs on
  // elements inside the sticky header + overflow container
  await page.evaluate(() => {
    (document.querySelector('[data-testid="create-team-button"]') as HTMLElement)?.click()
  })
  await page.waitForSelector('[data-testid="create-team-dialog"]')
  await page.evaluate((val) => {
    const input = document.querySelector('[data-testid="create-team-name-input"]') as HTMLInputElement
    if (input) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
      nativeInputValueSetter?.call(input, val)
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }, name)
  await page.evaluate(() => {
    (document.querySelector('[data-testid="create-team-submit"]') as HTMLElement)?.click()
  })
  await page.waitForSelector('[data-testid="create-team-dialog"]', { state: 'detached' })
}

async function deleteTeamByTab(page: import('@playwright/test').Page, name: string) {
  await page.evaluate((n) => {
    const tabs = document.querySelectorAll('[role="tab"]')
    for (const t of tabs) {
      if (t.textContent?.includes(n)) {
        const btn = t.querySelector('[aria-label^="Delete team"]') as HTMLElement
        btn?.click()
        break
      }
    }
  }, name)
  await page.waitForSelector('[data-testid="delete-team-dialog"]')
  await page.evaluate(() => {
    (document.querySelector('[data-testid="delete-team-confirm"]') as HTMLElement)?.click()
  })
  await page.waitForSelector('[data-testid="delete-team-dialog"]', { state: 'detached' })
}

test.describe('Mission Deck - Multi-Team Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?e2e=mock', { waitUntil: 'networkidle' })
    // Wait for auto-created user team panel to render
    await page.waitForSelector('[data-testid^="team-panel-"]', { timeout: 15000 })
  })

  test('dashboard loads with auto-created team instead of login page', async ({ page }) => {
    await expect(page.locator('button', { hasText: 'Sign in with Google' })).not.toBeVisible()
    await expect(page.locator('h1', { hasText: 'Mission Deck' })).toBeVisible()
    const panels = page.locator('[data-testid^="team-panel-"]')
    await expect(panels).toHaveCount(1)
  })

  test('header shows user email and sign out button', async ({ page }) => {
    await expect(page.locator('text=testuser@missiondeck.dev')).toBeVisible()
    await expect(page.locator('button', { hasText: 'Sign out' })).toBeVisible()
  })

  test('team selector is visible with tablist role', async ({ page }) => {
    const tablist = page.locator('[role="tablist"]')
    await expect(tablist).toBeVisible()
    await expect(tablist).toHaveAttribute('aria-label', 'Select team to monitor')
    await expect(page.locator('[data-testid="team-tab-all"]')).toBeVisible()
  })

  test('connection status indicator exists in header', async ({ page }) => {
    const statusDot = page.locator('[aria-label="Connected to Firebase"], [aria-label="Disconnected from Firebase"]')
    await expect(statusDot).toBeVisible({ timeout: 5000 })
  })

  test('create team flow works', async ({ page }) => {
    await expect(page.locator('[data-testid^="team-panel-"]')).toHaveCount(1)
    await createTeam(page, 'Alpha Strike')
    await expect(page.locator('[data-testid^="team-panel-"]')).toHaveCount(2)
    await expect(page.locator('[role="tab"]', { hasText: 'Alpha Strike' })).toBeVisible()
  })

  test('delete team flow works', async ({ page }) => {
    await createTeam(page, 'Temp Team')
    await expect(page.locator('[role="tab"]', { hasText: 'Temp Team' })).toBeVisible()
    await expect(page.locator('[data-testid^="team-panel-"]')).toHaveCount(2)
    await deleteTeamByTab(page, 'Temp Team')
    await expect(page.locator('[role="tab"]', { hasText: 'Temp Team' })).not.toBeVisible()
    await expect(page.locator('[data-testid^="team-panel-"]')).toHaveCount(1)
  })

  test('search filters teams by name', async ({ page }) => {
    // Create extra teams for search testing
    await createTeam(page, 'Alpha Strike')
    await createTeam(page, 'Byte Force')
    await expect(page.locator('[data-testid^="team-panel-"]')).toHaveCount(3)

    const searchInput = page.locator('[data-testid="search-input"]')
    await expect(searchInput).toBeVisible()
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="search-input"]') as HTMLInputElement
      if (input) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
        nativeInputValueSetter?.call(input, 'Alpha')
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })
    await expect(page.locator('[data-testid^="team-panel-"]')).toHaveCount(1)
    await expect(page.locator('[data-testid^="team-panel-"]').first().locator('h2')).toContainText('Alpha Strike')
  })

  test('status filter chips are visible and interactive', async ({ page }) => {
    const filterAll = page.locator('[data-testid="filter-all"]')
    const filterActive = page.locator('[data-testid="filter-active"]')
    await expect(filterAll).toBeVisible()
    await expect(filterActive).toBeVisible()
    await expect(filterAll).toHaveAttribute('aria-checked', 'true')
    await filterActive.click()
    await expect(filterActive).toHaveAttribute('aria-checked', 'true')
    await expect(filterAll).toHaveAttribute('aria-checked', 'false')
  })

  test('focused view shows single team, All returns to grid', async ({ page }) => {
    // Create a second team so grid has multiple panels
    await createTeam(page, 'Byte Force')
    await expect(page.locator('[data-testid^="team-panel-"]')).toHaveCount(2)

    // Click the Byte Force team tab to enter focused view
    await page.evaluate(() => {
      const tabs = document.querySelectorAll('[role="tab"]')
      for (const t of tabs) {
        if (t.textContent?.includes('Byte Force')) {
          ;(t as HTMLElement).click()
          break
        }
      }
    })
    await expect(page.locator('[data-testid^="team-panel-"]')).toHaveCount(1)
    // Search bar should be hidden in focused view
    await expect(page.locator('[data-testid="search-input"]')).not.toBeVisible()

    // Click All tab to return to grid
    await page.evaluate(() => {
      (document.querySelector('[data-testid="team-tab-all"]') as HTMLElement)?.click()
    })
    await expect(page.locator('[data-testid^="team-panel-"]')).toHaveCount(2)
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible()
  })

  test('timeline section is visible in team panel', async ({ page }) => {
    const panel = page.locator('[data-testid^="team-panel-"]').first()
    await expect(panel).toBeVisible()
    const timeline = panel.locator('[data-testid="timeline-section"]')
    await timeline.scrollIntoViewIfNeeded()
    await expect(timeline).toBeVisible()
    await expect(timeline).toHaveAttribute('aria-label', 'Agent timeline')
  })

  test('no unexpected console errors on authenticated page', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    await page.goto('/?e2e=mock', { waitUntil: 'networkidle' })
    await page.waitForSelector('[data-testid^="team-panel-"]', { timeout: 15000 })
    await page.waitForTimeout(2000)
    const unexpectedErrors = errors.filter(
      (e) =>
        !e.includes('auth') &&
        !e.includes('Auth') &&
        !e.includes('Firebase') &&
        !e.includes('firebase') &&
        !e.includes('PERMISSION_DENIED') &&
        !e.includes('permission_denied') &&
        !e.includes('ERR_INTERNET_DISCONNECTED') &&
        !e.includes('net::ERR_')
    )
    expect(unexpectedErrors).toHaveLength(0)
  })
})
