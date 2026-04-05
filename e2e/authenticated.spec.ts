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

  test('toast appears when agent enters error state', async ({ page }) => {
    await page.evaluate(() => {
      const teamPanels = document.querySelectorAll('[data-testid^="team-panel-"]')
      const teamId = teamPanels[0]?.getAttribute('data-testid')?.replace('team-panel-', '')
      if (teamId && (window as any).__mockWriteData) {
        ;(window as any).__mockWriteData(`/mission-deck/teams/${teamId}/agents/execution-agent`, {
          name: 'Execution',
          status: 'error',
          systemPrompt: 'test',
          lastActivity: Date.now(),
        })
      }
    })
    const toast = page.locator('[data-testid="toast-container"]')
    await expect(toast).toBeVisible({ timeout: 5000 })
    const toastItem = page.locator('[role="alert"]').last()
    await expect(toastItem).toContainText('Execution')
  })

  test('toast can be manually dismissed', async ({ page }) => {
    await page.evaluate(() => {
      const teamPanels = document.querySelectorAll('[data-testid^="team-panel-"]')
      const teamId = teamPanels[0]?.getAttribute('data-testid')?.replace('team-panel-', '')
      if (teamId && (window as any).__mockWriteData) {
        ;(window as any).__mockWriteData(`/mission-deck/teams/${teamId}/agents/execution-agent`, {
          name: 'Execution',
          status: 'error',
          systemPrompt: 'test',
          lastActivity: Date.now(),
        })
      }
    })
    const toast = page.locator('[data-testid="toast-container"]')
    await expect(toast).toBeVisible({ timeout: 5000 })
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid^="toast-dismiss-"]') as HTMLElement
      btn?.click()
    })
    await expect(toast).not.toBeVisible({ timeout: 3000 })
  })

  test('toast auto-dismisses after timeout', async ({ page }) => {
    await page.evaluate(() => {
      const teamPanels = document.querySelectorAll('[data-testid^="team-panel-"]')
      const teamId = teamPanels[0]?.getAttribute('data-testid')?.replace('team-panel-', '')
      if (teamId && (window as any).__mockWriteData) {
        ;(window as any).__mockWriteData(`/mission-deck/teams/${teamId}/agents/plan-builder-agent`, {
          name: 'Plan Builder',
          status: 'error',
          systemPrompt: 'test',
          lastActivity: Date.now(),
        })
      }
    })
    const toast = page.locator('[data-testid="toast-container"]')
    await expect(toast).toBeVisible({ timeout: 5000 })
    await expect(toast).not.toBeVisible({ timeout: 8000 })
  })

  test('multiple toasts stack when multiple agents error', async ({ page }) => {
    await page.evaluate(() => {
      const teamPanels = document.querySelectorAll('[data-testid^="team-panel-"]')
      const teamId = teamPanels[0]?.getAttribute('data-testid')?.replace('team-panel-', '')
      if (teamId && (window as any).__mockWriteData) {
        ;(window as any).__mockWriteData(`/mission-deck/teams/${teamId}/agents/execution-agent`, {
          name: 'Execution',
          status: 'error',
          systemPrompt: 'test',
          lastActivity: Date.now(),
        })
        ;(window as any).__mockWriteData(`/mission-deck/teams/${teamId}/agents/playwright-test-agent`, {
          name: 'Playwright Test',
          status: 'error',
          systemPrompt: 'test',
          lastActivity: Date.now(),
        })
      }
    })
    const container = page.locator('[data-testid="toast-container"]')
    await expect(container).toBeVisible({ timeout: 5000 })
    const toastItems = container.locator('[role="alert"]')
    await expect(toastItems).toHaveCount(2, { timeout: 5000 })
  })

  test('waterfall progress indicator is visible in team panel', async ({ page }) => {
    const panel = page.locator('[data-testid^="team-panel-"]').first()
    const waterfall = panel.locator('[data-testid="waterfall-progress"]')
    await waterfall.scrollIntoViewIfNeeded()
    await expect(waterfall).toBeVisible()
    await expect(waterfall).toHaveRole('progressbar')
    await expect(waterfall).toHaveAttribute('aria-valuemax', '8')
  })

  test('dashboard stats visible in grid view with 4 stat cards', async ({ page }) => {
    const stats = page.locator('[data-testid="dashboard-stats"]')
    await expect(stats).toBeVisible()
    await expect(stats).toHaveAttribute('role', 'region')
    await expect(page.locator('[data-testid="stat-teams"]')).toBeVisible()
    await expect(page.locator('[data-testid="stat-active"]')).toBeVisible()
    await expect(page.locator('[data-testid="stat-errors"]')).toBeVisible()
    await expect(page.locator('[data-testid="stat-progress"]')).toBeVisible()
  })

  test('dashboard stats hidden in focused view', async ({ page }) => {
    await createTeam(page, 'Stats Test Team')
    // Click the team tab to enter focused view
    await page.evaluate(() => {
      const tabs = document.querySelectorAll('[role="tab"]')
      for (const t of tabs) {
        if (t.textContent?.includes('Stats Test Team')) {
          ;(t as HTMLElement).click()
          break
        }
      }
    })
    await expect(page.locator('[data-testid^="team-panel-"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="dashboard-stats"]')).not.toBeVisible()
  })

  test('agent metrics section is visible and expandable', async ({ page }) => {
    const panel = page.locator('[data-testid^="team-panel-"]').first()
    const metricsSection = panel.locator('[data-testid="agent-metrics"]')
    await metricsSection.scrollIntoViewIfNeeded()
    await expect(metricsSection).toBeVisible()
    await expect(metricsSection).toHaveAttribute('aria-label', 'Agent performance metrics')

    // Expand the metrics section
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="agent-metrics"] button') as HTMLElement
      btn?.click()
    })
    await expect(page.locator('[data-testid="agent-metrics-empty"]')).toBeVisible({ timeout: 3000 })
  })

  test('agent metrics shows data when timeline events exist', async ({ page }) => {
    const teamId = await page.evaluate(() => {
      const panel = document.querySelector('[data-testid^="team-panel-"]')
      return panel?.getAttribute('data-testid')?.replace('team-panel-', '') ?? ''
    })
    const now = Date.now()
    await page.evaluate(({ tid, ts }) => {
      const w = (window as any).__mockWriteData
      if (!w) return
      w(`/mission-deck/teams/${tid}/timeline/evt1`, {
        agentName: 'execution-agent',
        status: 'active',
        fromStatus: 'idle',
        timestamp: ts - 5000,
      })
      w(`/mission-deck/teams/${tid}/timeline/evt2`, {
        agentName: 'execution-agent',
        status: 'complete',
        fromStatus: 'active',
        timestamp: ts,
      })
    }, { tid: teamId, ts: now })

    const metricsSection = page.locator('[data-testid="agent-metrics"]')
    await metricsSection.scrollIntoViewIfNeeded()

    // Expand the metrics section
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="agent-metrics"] button') as HTMLElement
      btn?.click()
    })
    await expect(page.locator('[data-testid="agent-metric-row"]')).toBeVisible({ timeout: 5000 })
  })

  test('clicking agent name opens detail panel with agent info', async ({ page }) => {
    const teamId = await page.evaluate(() => {
      const panel = document.querySelector('[data-testid^="team-panel-"]')
      return panel?.getAttribute('data-testid')?.replace('team-panel-', '') ?? ''
    })
    const now = Date.now()
    // Inject timeline data for execution-agent
    await page.evaluate(({ tid, ts }) => {
      const w = (window as any).__mockWriteData
      if (!w) return
      w(`/mission-deck/teams/${tid}/timeline/detail-evt1`, {
        agentName: 'execution-agent',
        status: 'active',
        fromStatus: 'idle',
        timestamp: ts - 10000,
      })
      w(`/mission-deck/teams/${tid}/timeline/detail-evt2`, {
        agentName: 'execution-agent',
        status: 'complete',
        fromStatus: 'active',
        timestamp: ts - 5000,
      })
      w(`/mission-deck/teams/${tid}/timeline/detail-evt3`, {
        agentName: 'plan-builder-agent',
        status: 'active',
        fromStatus: 'idle',
        timestamp: ts - 3000,
      })
    }, { tid: teamId, ts: now })

    // Click the execution-agent name to open detail
    const panel = page.locator('[data-testid^="team-panel-"]').first()
    const agentNameBtn = panel.locator('[data-testid="agent-name-execution-agent"]')
    await agentNameBtn.scrollIntoViewIfNeeded()
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="agent-name-execution-agent"]') as HTMLElement
      btn?.click()
    })

    // Detail panel should appear
    const detailPanel = page.locator('[data-testid="agent-detail-panel"]')
    await expect(detailPanel).toBeVisible({ timeout: 5000 })

    // Should show correct agent name
    const detailName = page.locator('[data-testid="agent-detail-name"]')
    await expect(detailName).toContainText('Execution')

    // Stats should be visible
    await expect(page.locator('[data-testid="agent-detail-stats"]')).toBeVisible()

    // Events should only show execution-agent events (not plan-builder-agent)
    const events = page.locator('[data-testid="agent-detail-events"]')
    await expect(events).toBeVisible()
    const eventText = await events.textContent()
    expect(eventText).not.toContain('plan-builder-agent')
  })

  test('agent detail panel close button hides panel', async ({ page }) => {
    const panel = page.locator('[data-testid^="team-panel-"]').first()
    const agentNameBtn = panel.locator('[data-testid="agent-name-execution-agent"]')
    await agentNameBtn.scrollIntoViewIfNeeded()
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="agent-name-execution-agent"]') as HTMLElement
      btn?.click()
    })
    await expect(page.locator('[data-testid="agent-detail-panel"]')).toBeVisible({ timeout: 5000 })

    // Close via close button
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="agent-detail-close"]') as HTMLElement
      btn?.click()
    })
    await expect(page.locator('[data-testid="agent-detail-panel"]')).not.toBeVisible({ timeout: 3000 })
  })

  test('command palette trigger button visible in header', async ({ page }) => {
    const trigger = page.locator('[data-testid="command-palette-trigger"]')
    await expect(trigger).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-label', 'Open command palette')
  })

  test('command palette opens with trigger button and closes with Escape', async ({ page }) => {
    await expect(page.locator('[data-testid="command-palette"]')).not.toBeVisible()
    // Use evaluate to click trigger (avoids Playwright actionability hang on sticky header)
    await page.evaluate(() => {
      (document.querySelector('[data-testid="command-palette-trigger"]') as HTMLElement)?.click()
    })
    await expect(page.locator('[data-testid="command-palette"]')).toBeVisible({ timeout: 3000 })
    // Close via Escape key dispatched through evaluate
    await page.evaluate(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    await expect(page.locator('[data-testid="command-palette"]')).not.toBeVisible({ timeout: 3000 })
  })

  test('command palette search filters actions', async ({ page }) => {
    await page.evaluate(() => {
      (document.querySelector('[data-testid="command-palette-trigger"]') as HTMLElement)?.click()
    })
    await expect(page.locator('[data-testid="command-palette"]')).toBeVisible({ timeout: 3000 })
    const items = page.locator('[data-testid="command-palette-item"]')
    const initialCount = await items.count()
    expect(initialCount).toBeGreaterThan(0)

    // Type to filter using native value setter (same pattern as create team)
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="command-palette-input"]') as HTMLInputElement
      if (input) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
        nativeInputValueSetter?.call(input, 'Create')
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })
    const filteredCount = await items.count()
    expect(filteredCount).toBeLessThan(initialCount)
    await expect(items.first()).toContainText('Create')
  })

  test('command palette Create New Team action opens create dialog', async ({ page }) => {
    await page.evaluate(() => {
      (document.querySelector('[data-testid="command-palette-trigger"]') as HTMLElement)?.click()
    })
    await expect(page.locator('[data-testid="command-palette"]')).toBeVisible({ timeout: 3000 })
    // Click Create New Team action
    await page.evaluate(() => {
      const items = document.querySelectorAll('[data-testid="command-palette-item"]')
      for (const item of items) {
        if (item.textContent?.includes('Create New Team')) {
          ;(item as HTMLElement).click()
          break
        }
      }
    })
    await expect(page.locator('[data-testid="command-palette"]')).not.toBeVisible({ timeout: 3000 })
    await expect(page.locator('[data-testid="create-team-dialog"]')).toBeVisible({ timeout: 3000 })
  })

  test('command palette switch team enters focused view', async ({ page }) => {
    // Create a second team first
    await createTeam(page, 'Palette Test Team')
    await expect(page.locator('[data-testid^="team-panel-"]')).toHaveCount(2)

    // Open palette
    await page.evaluate(() => {
      (document.querySelector('[data-testid="command-palette-trigger"]') as HTMLElement)?.click()
    })
    await expect(page.locator('[data-testid="command-palette"]')).toBeVisible({ timeout: 3000 })
    // Click the team switch action
    await page.evaluate(() => {
      const items = document.querySelectorAll('[data-testid="command-palette-item"]')
      for (const item of items) {
        if (item.textContent?.includes('Palette Test Team')) {
          ;(item as HTMLElement).click()
          break
        }
      }
    })
    await expect(page.locator('[data-testid="command-palette"]')).not.toBeVisible({ timeout: 3000 })
    // Should be in focused view with just one panel
    await expect(page.locator('[data-testid^="team-panel-"]')).toHaveCount(1)
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
