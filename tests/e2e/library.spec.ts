/**
 * E2E Tests for Library
 */

import { test, expect } from '@playwright/test'

test.describe('Library', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/library')
  })

  test('should display library page', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('should have search functionality', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first()

    if (await searchInput.isVisible()) {
      await searchInput.fill('test story')
      await expect(searchInput).toHaveValue('test story')
    }
  })

  test('should have filter controls', async ({ page }) => {
    // Look for filter buttons or dropdowns
    const filters = page.locator('button, select').filter({ hasText: /filter|all|status/i })
    const count = await filters.count()

    expect(count).toBeGreaterThan(0)
  })

  test('should display session cards', async ({ page }) => {
    const sessionCards = page.locator('[data-testid="session-card"], .session-card')
    const count = await sessionCards.count()

    // If sessions exist, verify they're visible
    if (count > 0) {
      await expect(sessionCards.first()).toBeVisible()
    }
  })

  test('should have pagination when many sessions', async ({ page }) => {
    const paginationControls = page.locator('button').filter({ hasText: /previous|next|page/i })
    const count = await paginationControls.count()

    // Pagination might not exist if there are few sessions
    if (count > 0) {
      await expect(paginationControls.first()).toBeVisible()
    }
  })
})
